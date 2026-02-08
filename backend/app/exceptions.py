"""Custom exceptions for the application"""


class InsufficientStockError(Exception):
    """Raised when there's insufficient stock for an order"""
    pass


class ProductNotFoundError(Exception):
    """Raised when a product is not found"""
    pass
