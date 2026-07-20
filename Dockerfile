# https://docs.docker.com/reference/dockerfile/
# https://docs.docker.com/build/concepts/dockerfile/
FROM node:20
WORKDIR /app
COPY package*.json ./
# copy all packages into container
RUN npm install
# ran inside the container
COPY . .
# copy all project files into container
EXPOSE 8081
# EXPOSE does not open the port, just documents it
CMD ["npm", "run", "dev"]
# when this container is run, do "npm run start"