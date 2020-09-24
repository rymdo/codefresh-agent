ARG BASE_IMAGE=node:14-alpine3.12

FROM ${BASE_IMAGE} as app
WORKDIR /build
RUN apk add --no-cache git
COPY package.json .
COPY yarn.lock .
RUN yarn --frozen-lockfile
COPY tsconfig.json .
COPY src ./src
RUN yarn build

FROM ${BASE_IMAGE} as node-modules
WORKDIR /build
RUN apk add --no-cache git
COPY package.json .
COPY yarn.lock .
RUN yarn --frozen-lockfile --production

FROM ${BASE_IMAGE}
WORKDIR /app
RUN apk add --no-cache git
COPY --from=app /build/build .
COPY --from=node-modules /build/node_modules ./node_modules

CMD [ "node", "main.js" ]
