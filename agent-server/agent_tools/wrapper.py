from functools import wraps

def _short_error(error: Exception) -> str:
    message = str(error).strip() or "unknown error"
    return f"Error: {type(error).__name__}: {message[:200]}"

def _catch_tool_errors(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        try:
            return function(*args, **kwargs)
        except Exception as error:
            return _short_error(error)

    return wrapped
