#!/usr/bin/env python3
# teltonika_server.py — grava em banco.db/localizacoes com device_id

import argparse, asyncio, datetime as dt, ipaddress, os, sqlite3, struct, re
from typing import List, Tuple, Dict, Any

DB_FILE = os.environ.get("TELTONIKA_DB", "banco.db")

# ===== DB =====
def db():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False, detect_types=sqlite3.PARSE_DECLTYPES)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def db_init():
    with db() as con:
        con.execute("PRAGMA journal_mode=WAL;")
        con.execute("""CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL DEFAULT 0,
            imei TEXT NOT NULL UNIQUE,
            nome TEXT, ativo INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );""")
        con.execute("""CREATE TABLE IF NOT EXISTS localizacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_usuario INTEGER NOT NULL,
            device_id INTEGER,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            speed_kmh REAL, altitude_m INTEGER, angle_deg INTEGER, sats INTEGER, event_id INTEGER,
            FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
        );""")
        con.commit()

def upsert_device_by_imei(imei: str) -> Dict[str, Any]:
    with db() as con:
        cur = con.cursor()
        cur.execute("SELECT id, id_usuario FROM devices WHERE imei=?;", (imei,))
        ex = cur.fetchone()
        if ex: return dict(ex)
        cur.execute("INSERT INTO devices (id_usuario, imei, ativo) VALUES (0, ?, 1);", (imei,))
        con.commit()
        return {"id": cur.lastrowid, "id_usuario": 0}

def insert_positions(device_id: int, id_usuario: int, recs: List[Dict[str,Any]]) -> int:
    if not recs: return 0
    with db() as con:
        con.executemany("""
            INSERT INTO localizacoes
            (id_usuario, device_id, latitude, longitude, data_hora, speed_kmh, altitude_m, angle_deg, sats, event_id)
            VALUES (?,?,?,?,?,?,?,?,?,?);
        """, [
            (id_usuario or 0, device_id, r["lat"], r["lon"], r["time_utc"], r.get("speed_kmh"),
             r.get("altitude_m"), r.get("angle_deg"), r.get("sats"), r.get("event_id"))
            for r in recs
        ])
        con.commit()
        return len(recs)

# ===== Protocolo Teltonika =====
def crc16_ibm(data: bytes) -> int:
    crc = 0x0000
    for b in data:
        crc ^= b
        for _ in range(8):
            crc = (crc >> 1) ^ 0xA001 if (crc & 1) else (crc >> 1)
    return crc & 0xFFFF

def be_u32(b: bytes) -> int: return struct.unpack(">I", b)[0]
def be_i32(b: bytes) -> int: return struct.unpack(">i", b)[0]
def be_i16(b: bytes) -> int: return struct.unpack(">h", b)[0]
def be_u16(b: bytes) -> int: return struct.unpack(">H", b)[0]
def be_u64(b: bytes) -> int: return struct.unpack(">Q", b)[0]

async def read_exact(r: asyncio.StreamReader, n:int) -> bytes: return await r.readexactly(n)

def parse_gps(buf: memoryview, o:int) -> Tuple[dict,int]:
    lon = be_i32(buf[o:o+4]) / 10_000_000
    lat = be_i32(buf[o+4:o+8]) / 10_000_000
    alt = be_i16(buf[o+8:o+10]); ang = be_u16(buf[o+10:o+12])
    sats = buf[o+12]; spd = be_u16(buf[o+13:o+15])
    return {"lat":lat,"lon":lon,"altitude_m":int(alt),"angle_deg":int(ang),"sats":int(sats),"speed_kmh":float(spd)}, o+15

def skip_io(buf: memoryview, o:int, codec:int) -> int:
    # Avança IO Elements (padrão suficiente p/ FMB)
    o0 = o
    try:
        if codec == 0x8E:
            o += 2  # event + total (aprox.)
            for size in (1,2,4,8):
                cnt = buf[o]; o += 1; o += cnt * (1+size)
            return o
        # Codec 8
        o += 2
        for step in (2,3,5,9):
            cnt = buf[o]; o += 1; o += cnt * step
        return o
    except Exception:
        return o0

def parse_rec(b: bytes, codec:int) -> Tuple[dict,int]:
    mv = memoryview(b); o = 0
    ts = be_u64(mv[o:o+8]); o+=8
    pr = mv[o]; o+=1
    gps, o = parse_gps(mv, o)
    io_start = o
    o = skip_io(mv, o, codec)
    return {"timestamp_ms":ts, "time_utc":dt.datetime.utcfromtimestamp(ts/1000.0), "priority":int(pr),
            "codec":codec, "event_id": int(mv[io_start]), **gps}, o

def parse_payload(payload: bytes) -> Tuple[int, List[dict]]:
    o=0; codec=payload[0]; o+=1; n1=payload[1]; o+=1; recs=[]
    for _ in range(n1):
        r,used = parse_rec(memoryview(payload)[o:].tobytes(), codec); recs.append(r); o+=used
    n2 = payload[o]
    if n2 != n1: raise ValueError("NumberOfData2 diferente de NumberOfData1")
    return codec, recs

# ===== Handler TCP =====
class Handler:
    def __init__(self, r: asyncio.StreamReader, w: asyncio.StreamWriter):
        self.r=r; self.w=w; self.peer=w.get_extra_info("peername")

    async def handshake(self) -> str:
        imei_len = be_u16(await read_exact(self.r, 2))
        imei = (await read_exact(self.r, imei_len)).decode("ascii","ignore").strip()
        self.w.write(b"\x01"); await self.w.drain()
        return re.sub(r"\D","", imei)

    async def read_packet(self) -> Tuple[List[dict], int]:
        if await read_exact(self.r,4) != b"\x00\x00\x00\x00": raise ValueError("Preamble inválido.")
        dlen = be_u32(await read_exact(self.r,4))
        data = await read_exact(self.r, dlen)
        crc = be_u32(await read_exact(self.r,4))
        if (crc & 0xFFFF) != crc16_ibm(data): raise ValueError("CRC inválido.")
        return parse_payload(data)

    async def ack(self, n:int):
        self.w.write(struct.pack(">I", n)); await self.w.drain()

    async def handle(self):
        try:
            imei = await self.handshake()
            dev = upsert_device_by_imei(imei)
            device_id, id_usuario = dev["id"], dev["id_usuario"]
            print(f"[+] IMEI {imei} conectado (device_id={device_id}, user={id_usuario}) de {self.peer}")
            while True:
                try:
                    recs, codec = await self.read_packet()
                except asyncio.IncompleteReadError:
                    print(f"[-] Conexão encerrada por {self.peer}")
                    break
                insert_positions(device_id, id_usuario, recs)
                for r in recs:
                    print(f"@{r['time_utc']} {imei} LAT {r['lat']:.6f} LON {r['lon']:.6f} "
                          f"V {r.get('speed_kmh',0):.0f}km/h SAT {r.get('sats','-')} EVT {r.get('event_id','-')} (0x{codec:02X})")
                await self.ack(len(recs))
        except Exception as e:
            print(f"[!] Erro {self.peer}: {e}")
        finally:
            try: self.w.close(); await self.w.wait_closed()
            except: pass

# ===== Runner =====
async def run(host:str, port:int):
    srv = await asyncio.start_server(lambda r,w: Handler(r,w).handle(), host, port)
    print(f"Servidor Teltonika ouvindo em {host}:{port} usando DB: {DB_FILE}")
    async with srv: await srv.serve_forever()

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--host", default=os.environ.get("TELTONIKA_HOST","0.0.0.0"))
    p.add_argument("--port", type=int, default=int(os.environ.get("TELTONIKA_PORT","5027")))
    a = p.parse_args()
    try: ipaddress.ip_address(a.host)
    except ValueError:
        if a.host != "localhost": print(f"Aviso: host '{a.host}' pode não ser um IP válido.")
    db_init()
    try: asyncio.run(run(a.host, a.port))
    except KeyboardInterrupt: print("\nEncerrado.")

if __name__ == "__main__":
    main()
