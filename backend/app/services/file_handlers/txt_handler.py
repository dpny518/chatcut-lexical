async def parse(content):
    lines = content.decode().split('\n')
    return [{"text": line.strip()} for line in lines if line.strip()]