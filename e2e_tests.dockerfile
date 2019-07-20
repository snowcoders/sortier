## Build a node application
from node:8.11.1

## Sortier creation, build and test
RUN echo "### sortier"
WORKDIR /sortier
COPY . .
RUN npm install --unsafe-perm
RUN npm run test

## react-redux-typescript-guide/playground
RUN echo "### react-redux-typescript-guide"
WORKDIR /react-redux-typescript-guide
RUN git clone https://github.com/piotrwitek/react-redux-typescript-guide .
WORKDIR /react-redux-typescript-guide/playground
RUN npm install --unsafe-perm
RUN echo "{ isHelpMode: true }" > .sortierrc
WORKDIR /sortier
RUN npm run start -- "/react-redux-typescript-guide/playground/src/**/*.ts"
RUN npm run start -- "/react-redux-typescript-guide/playground/src/**/*.tsx"
WORKDIR /react-redux-typescript-guide/playground
RUN npm run build
RUN npm run test -- --watchAll=false

## prettier
RUN echo "### prettier"
WORKDIR /prettier
RUN git clone https://github.com/prettier/prettier .
RUN npm install --unsafe-perm
RUN echo "{ isHelpMode: true }" > .sortierrc
WORKDIR /sortier
RUN npm run start -- "/prettier/src/**/*.js"
WORKDIR /prettier
RUN npm run build
RUN npm run test
