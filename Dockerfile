FROM node:14-alpine3.12 as builder
WORKDIR /builder
RUN apk add --no-cache git
COPY package.json .
COPY yarn.lock .
RUN yarn --frozen-lockfile
COPY tsconfig.json .
COPY src ./src
RUN yarn build

FROM node:14-alpine3.12
WORKDIR /app
RUN apk add --no-cache git
COPY package.json .
COPY yarn.lock .
RUN yarn --frozen-lockfile --production
RUN rm -rf package.json yarn.lock
COPY --from=builder /builder/build .

CMD [ "node", "main.js" ]
