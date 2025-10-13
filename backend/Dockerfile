FROM node:20-alpine

WORKDIR /app

# 1) Alpine packages: Python + build deps for pdfplumber/Pillow
RUN apk add --no-cache \
    python3 py3-pip \
    build-base \
    jpeg-dev zlib-dev

# 2) Node deps
COPY package.json package-lock.json* ./
RUN npm ci || npm i

# 3) Backend source
COPY . .

# 4) We'll keep parser deps in a venv (avoid "externally managed" error)
ENV VENV_PATH=/opt/venv
ENV PYTHON=${VENV_PATH}/bin/python
ENV PIP=${VENV_PATH}/bin/pip

# 5) Runtime: ensure venv exists, install parser deps (mounted at /app/audit-parser), then start
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# NOTE: audit-parser is volume-mounted via docker-compose at /app/audit-parser
CMD sh -lc '\
  if [ ! -x "${PYTHON}" ]; then \
    python3 -m venv "${VENV_PATH}"; \
  fi; \
  . "${VENV_PATH}/bin/activate" && \
  if [ -f /app/audit-parser/requirements.txt ]; then \
    pip install --no-cache-dir -r /app/audit-parser/requirements.txt; \
  fi; \
  node src/server.js'
