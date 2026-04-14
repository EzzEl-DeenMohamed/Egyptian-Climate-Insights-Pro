#
# # Application Models
# class User(BaseSchemaModel):
#     __tablename__ = "user"
#     id = Column(Integer, primary_key=True, index=True)
#     username = Column(String, unique=True, nullable=False)
#     email = Column(String, unique=True, nullable=False)
#     password = Column(String, nullable=False)
# 
# class Request(BaseSchemaModel):
#     __tablename__ = "request"
#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
#     status = Column(String, nullable=False)
#     created_at = Column(Date, nullable=False, default=date.today)
#
#     user = relationship("User")