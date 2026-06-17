from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# Product Schemas
class ProductBase(BaseModel):
    name: str
    sku: str
    price: float = Field(gt=0)
    stock_quantity: int = Field(ge=0)

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True

# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int

    class Config:
        from_attributes = True

# Order Schemas
class OrderBase(BaseModel):
    customer_id: int
    product_id: int
    quantity: int = Field(gt=0)

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: int
    total_price: float
    status: str
    created_at: datetime
    
    # We can add nested models if needed for detail view
    product: Product
    customer: Customer

    class Config:
        from_attributes = True
