FROM node:20-slim

WORKDIR /opt/apps/pkg_sender

COPY package.json package.json
RUN npm install

COPY src src
COPY bin/run bin/run

EXPOSE 3333

CMD ["bin/run"]
