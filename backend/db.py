from sqlmodel import SQLModel, create_engine

DATABASE_URL = "postgresql://postgres:Sn231204!@localhost/medagentx"

engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    SQLModel.metadata.create_all(engine)