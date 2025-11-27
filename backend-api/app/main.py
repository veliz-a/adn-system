from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Form
from sqlalchemy.orm import Session
from app.models import SessionLocal, User, SearchHistory, init_db
from app.auth import hash_password, verify_password, create_access_token, decode_token
from pydantic import BaseModel
import subprocess
import json
import os
from pathlib import Path
import tempfile
import platform
BASE_DIR = Path(__file__).resolve().parent.parent
MOTOR_PATH = BASE_DIR / ("motor_adn.exe" if os.name == "nt" else "motor_adn")

app = FastAPI(title="ADN Forensics API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en producción usar ["https://mi-frontend.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
security = HTTPBearer()

# Inicializa BD al arrancar
@app.on_event("startup")
def startup():
    init_db()
    print("Base de datos inicializada")

# Dependency para obtener sesión de BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== MODELOS PYDANTIC ==========
class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class SearchRequest(BaseModel):
    pattern: str
    algorithm: str  # "kmp" o "rabin_karp"

# ========== HELPER: VERIFICAR JWT ==========
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    try:
        payload = decode_token(credentials.credentials)
        user = db.query(User).filter(User.id == payload["user_id"]).first()
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")

# ========== ENDPOINTS ==========

@app.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Verificar si email existe
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    # Crear usuario
    hashed = hash_password(req.password)
    user = User(email=req.email, password_hash=hashed)
    db.add(user)
    db.commit()
    
    return {
        "user_id": str(user.id),
        "message": "Usuario creado exitosamente"
    }

@app.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    token = create_access_token(str(user.id), user.email)
    return {"access_token": token, "token_type": "bearer"}

@app.post("/upload-csv")
def upload_csv(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Solo archivos .csv permitidos")
    
    content = file.file.read().decode('utf-8')
    lines = content.strip().split('\n')
    
    # OMITIR primera línea si parece encabezado
    start_line = 1 if lines[0].lower().startswith(('nombre', 'name', 'id')) else 0
    
    for i, line in enumerate(lines[start_line:start_line+10], start_line+1):
        cols = line.split(',')
        if len(cols) != 2:
            raise HTTPException(
                status_code=400,
                detail=f"Línea {i}: formato incorrecto (debe tener 2 columnas)"
            )
        
        seq = cols[1].strip().upper()
        if not seq or not all(c in 'ACGT' for c in seq):
            raise HTTPException(
                status_code=400,
                detail=f"Línea {i}: secuencia inválida (solo A,C,G,T)"
            )
    
    return {
        "valid": True,
        "total_sequences": len(lines) - start_line,
        "filename": file.filename
    }

@app.post("/search")
async def search(
    pattern: str = Form(...),
    algorithm: str = Form(...),
    csv_file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validar algoritmo
    if algorithm not in ["kmp", "rabin_karp"]:
        raise HTTPException(status_code=400, detail="Algoritmo debe ser 'kmp' o 'rabin_karp'")
    
    # Guardar CSV temporalmente
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as tmp:
        content = await csv_file.read()
        tmp.write(content.decode('utf-8'))
        tmp_path = tmp.name
    
    try:
        # Ejecutar motor C++
        cmd = [
            str(MOTOR_PATH),
            "--algorithm", algorithm,
            "--pattern", pattern,
            "--csv", tmp_path
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Error del motor: {result.stderr}")
        
        motor_output = json.loads(result.stdout)
        
        # Guardar en BD
        search = SearchHistory(
            user_id=user.id,
            pattern=pattern,
            algorithm=algorithm,
            csv_filename=csv_file.filename,
            results=motor_output,
            match_count=motor_output.get("match_count", 0),
            execution_time_ms=motor_output.get("execution_time_ms", 0)
        )
        db.add(search)
        db.commit()
        
        return motor_output
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Timeout")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"JSON inválido del motor: {result.stdout}")
    finally:
        os.unlink(tmp_path)

@app.get("/history")
def get_history(
    limit: int = 10,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    searches = db.query(SearchHistory)\
        .filter(SearchHistory.user_id == user.id)\
        .order_by(SearchHistory.created_at.desc())\
        .limit(limit)\
        .offset(offset)\
        .all()
    
    total = db.query(SearchHistory).filter(SearchHistory.user_id == user.id).count()
    
    return {
        "searches": [
            {
                "id": str(s.id),
                "pattern": s.pattern,
                "algorithm": s.algorithm,
                "match_count": s.match_count,
                "execution_time_ms": s.execution_time_ms,
                "created_at": s.created_at.isoformat()
            }
            for s in searches
        ],
        "total": total
    }