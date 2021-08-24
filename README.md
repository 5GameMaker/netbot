# NetBot scanner

A very simple network scanner

Usage:
```bash
NOMETA=<true/false> \ # Disable metadata
MAX_BUFFER_SIZE=<-1 or 1+> \ # Set maximum size of buffer
MAX_BUFFER_COUNT=<-1 or 1+> \ # Set maximum amount of threads
node .
```

# TODO

## Parameters

- Add DEEP_SCAN=<none/-1/1+> parameter
- Add SCAN_PORTS=<port:type,...> parameter
- Add USE_PROXYLIST=<http://0.0.0.0:80/%r> parameter
- Add USE_TOR=<true/false> parameter
- Add ADDRESS_MASK=<protocol://p1.p2.p3.p4:port> parameter
- Add ADDRESS_RANGE=<[1-255/*].[1-255/*].[1-255/*].[1-255/*]/*> parameter

## Features

- Add web panel (can be enabled by specifying WEBPANEL=<off/protected/full>, disabled by default)
- Add webhook support (WEBHOOK_URL=<webhook uri>)
