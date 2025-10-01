<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

<!-- ABOUT-THE-PROJECT -->
# About The Project
Tomo is a social media app that allows users to connect to friends, share posts, and instant message. Given that we have enough social media as it stands, this project serves as an exercise for me in a few different frameworks/technologies (see below).

## Built With
* [![Next][Next.js]][Next-url]
* [![React][React.js]][React-url]
* [![Node][Node.js]][Node-url]
* [![Express][Express.js]][Express-url]
* [![Mongo][MongoDB]][Mongo-url]
* [![Redis][Redis]][Redis-url]
* [![Azure][Azure]][Azure-url]
* [![Docker][Docker]][Docker-url]
* [![Kubernetes][Kubernetes]][Kubernetes-url]

<!-- PREREQUISITES -->
## Prerequisites
This application is prepared for production deployment on Azure via Azure Kubernetes Service (AKS). For development purposes, I deployed the application locally with Docker and Docker Compose.

### Production Deployment
_The following Azure infrastructure and services must be prepared for production deployment:_
* Azure Kubernetes Service cluster with a node pool provisioned
* Azure Container Registry repository for hosting Docker images
* Azure Key Vault for secret storage

### Local Deployment
_The following must be installed for local deployment:_
* Docker

In addition to the above prerequisites, you must also create a Google Cloud project and credentials for a new OAuth 2.0 client. Take note of the ***Client ID*** and ***Client Secret***, and keep them confidential.

<!-- INSTALLATION -->
## Installation
1. Clone the repo
   ```sh
   git clone https://github.com/njfealy/tomo
   ```
2. Route into backend folder and install dependencies
   ```sh
   cd ./tomo/tomo-back
   npm install
   ```
3. Do the same for frontend folder
   ```sh
   cd ../tomo/tomo-front
   npm install
   ```
4. Create an .env file in parent directory of the repo
   ```sh
   cd ../
   touch .env
   ```
5. Create environment variables for the following:
   ```.env
   PORT=5000
   BACK_URL=http://localhost:5000/api
   FRONT_URL=http://localhost:3000
   MONGO_LOCAL_URI=mongodb://localhost:27017/?replicaSet=rs0&directConnection=true
   
   GOOGLE_CLIENT_ID=your_client_id 
   GOOGLE_CLIENT_SECRET=your_client_secret    ### Keep this confidential ###
   ```
6. Route into backend folder and start MongoDB and Redis locally with docker-compose
   ```sh
   cd ./tomo-back
   docker compose up -d
   ```
7. MongoDB Node driver requires a replica set for transaction support. Here we will configure a single-node replica set:
   ```sh
   docker exec -it mongo1 mongosh
   ```
   _mongosh:_
   ```sh
   rs.initiate({_id: "rs0", members: [{_id: 0, host: "mongo1:27017"}] })
   exit
   ```
7. While still in backend folder, wait for MongoDB and Redis to initialize. After, start backend
   ```sh
   cd ./tomo-back
   npm start
   ```
8. Do same for frontend
   ```sh
   cd ../tomo-front
   npm run dev
   ```

You should now be able to access the app frontend at http://localhost:3000.
For development and testing, you can also manage the MongoDB and Redis instances with Mongo Express at http://localhost:8081 and RedisInsight at http://localhost:5540, respectively.


[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Node.js]: https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/
[Express.js]: https://img.shields.io/badge/express.js-000000?style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/
[MongoDB]: https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white
[Mongo-url]: https://www.mongodb.com/
[Redis]: https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white
[Redis-url]: https://redis.io/
[Azure]: https://img.shields.io/badge/Azure-0078D4?style=for-the-badge&logo=microsoft-azure&logoColor=white
[Azure-url]: https://azure.microsoft.com/
[Docker]: https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/
[Kubernetes]: https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white
[Kubernetes-url]: https://kubernetes.io/


