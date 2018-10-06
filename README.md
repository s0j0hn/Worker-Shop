[![TypeScript version][ts-badge]][typescript-30]
[![Node.js version][nodejs-badge]][nodejs]
# Resit Worker Shop

Architecture de fait avec [Node.js][nodejs] et [TypeScript][typescript] [3.0][typescript-30].

Inclus:

+ [TypeScript][typescript] [3.0][typescript-30],
+ [TSLint 5][tslint],
+ Definition de types pour nodejs et autres composants,
+ [NPM scripts for common operations](#available-scripts),
+ Redis et Mongodb
+ Support docker compose,
+ Support de logger
+ Operations asynchrone
+ Support swagger
+ Authentication avec Passport et JWT


## Pour démarrer

Ce projet doit être lancé avec une version LTS de [Node.js][nodejs].
Il vous faudra se procurer aussi docker et docker-compose sur votre système d'exploitation et d'initialiser le docker swarm. On part de base qu'il est préférable de lancer ce projet sur un Linux:
```sh
https://docs.docker.com/compose/install/#install-compose

https://docs.docker.com/engine/swarm/#swarm-mode-key-concepts-and-tutorial
```
Le tout sera lancé avec un serveur Redis pour les robots et une base de donné NoSQL Mongodb
```sh
https://redis.io/

https://www.mongodb.com/
```
## Scripts de lancements

+ `build` - Transformer typescript en javascript,
+ `run:api` - Lance api,
+ `run:robot` - Lance robot,
+ `lint` - Tester les fichiers,
+ `docker:start` - Démarre les conteneurs docker compose
+ `docker:stop` - Arrete les conteneurs docker compose

Pour télécharger les dépendances on lance la commande:
```sh
yarn install
```
ou
```sh
npm install
```
Example: (Vous pouvez utiliser aussi 'npm')
```sh
yarn docker:start
```
Une fois les dockers lancé et opérationnel nous pouvons démarrer l'API. D'abord il faut transformer le Typescript:
```sh
yarn build
```
Et après (il faut ajouter le paramètre APP_SEED=true pour remplir la database mais seulement la première fois)
```sh
APP_SEED=true yarn run:api
```
Ensuite on peut faire démarrer notre robot/worker. Ils ont besoin d'une position X et Y initial de lancement.
```sh
ROBOT_POSITION_X=3 ROBOT_POSITION_Y=1 yarn run:robot
```
Chaque robot est instancié dans son processus qui se lié à sa queue. Il NE DOIT PAS avoir des robot avec les mêmes positions.

Pour toute modification de port de l'API, address... On va se référer vers le fichier 'src/app/config/config.ts'

## Routes

La documentation des routes est disponible après le lancement de l'API sur url(defaut):
```sh
http;//localhost:8080/docs
```

Elle pourra servir de client pour interagir avec l'API.
L'utilisateur va se créer un compte ensuite va récupérer son token et l'entrer dans les paramètres Authorize de swagger pour accéder aux autres requetés


[ts-badge]: https://img.shields.io/badge/TypeScript-3.0-blue.svg
[nodejs-badge]: https://img.shields.io/badge/Node.js->=%208.9-blue.svg
[nodejs]: https://nodejs.org/dist/latest-v8.x/docs/api/
[typescript]: https://www.typescriptlang.org/
[typescript-30]: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html
[tslint]: https://palantir.github.io/tslint/
[tslint-microsoft-contrib]: https://github.com/Microsoft/tslint-microsoft-contrib
