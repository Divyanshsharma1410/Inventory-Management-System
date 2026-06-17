from sqlalchemy.orm import Session
from sqlalchemy import exc
from . import models, schemas
from fastapi import HTTPException, status

# Product CRUD
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.dict())
    try:
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product with this SKU already exists."
        )

# Customer CRUD
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(**customer.dict())
    try:
        db.add(db_customer)
        db.commit()
        db.refresh(db_customer)
        return db_customer
    except exc.IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer with this email already exists."
        )

# Order CRUD & Business Logic
def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).offset(skip).limit(limit).all()

def create_order(db: Session, order: schemas.OrderCreate):
    # 1. Get Product and Customer
    db_product = db.query(models.Product).filter(models.Product.id == order.product_id).first()
    db_customer = db.query(models.Customer).filter(models.Customer.id == order.customer_id).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # 2. Inventory Validation
    if db_product.stock_quantity < order.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock. Available: {db_product.stock_quantity}"
        )

    # 3. Create Order and Update Stock (Atomic Transaction)
    try:
        total_price = db_product.price * order.quantity
        db_order = models.Order(
            customer_id=order.customer_id,
            product_id=order.product_id,
            quantity=order.quantity,
            total_price=total_price,
            status="confirmed"
        )
        
        # Deduct stock
        db_product.stock_quantity -= order.quantity
        
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return db_order
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the order."
        )
