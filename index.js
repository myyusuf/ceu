'use strict';

const Hapi = require('hapi');
const mysql = require('mysql');
const configDB = require('./config/database.js');

//Mysql
const db = mysql.createConnection(configDB.mysqlConnectionData);

const validate = function (request, username, password, callback) {

    const err = null;
    let isValid = false;
    let credentials = {};

    if (validUsers[username] && validUsers[username] === password) {
        isValid = true;
        credentials = { username: username };
    }

    callback(err, isValid, credentials);
};

// Creating a Hapi server
const server = new Hapi.Server();
server.connection({
    port: 4000
});

server.bind(
  {
    db: db,
    apiBaseUrl: 'http://localhost:4000/api',
    webBaseUrl: 'http://localhost:4000'
  }
);

server.register([
  {
    register: require('good'),
    options: {
        reporters: [{
            reporter: require('good-console'),
            events: {
                response: '*'
            }
        }]
    }
  },
  {
    register: require('hapi-auth-cookie')
  },
  {
    register: require('inert')
  },
  {
    register: require('vision')
  }
], (err) => {

    if (err) {
        throw err;
    }

    server.views({
        engines: {
            hbs: require('handlebars')
        },
        relativeTo: __dirname,
        path: './views',
        layoutPath: './views/layout',
        layout: true,
        isCached: false,
        helpersPath: './views/helpers',
        partialsPath: './views/partials'
    });

    // server.auth.strategy('simple', 'basic', { validateFunc: validate });
    server.auth.strategy('session', 'cookie', 'try', {
        password: '70fe4f26ff9bcb5aab079875cadeec09',
        isSecure: false
    });

    // Setting up routes
    server.route(require('./routes'));

    // Starting the server
    server.start((err) => {

        if (err) {
            throw err;
        }
        console.log('Server running at:', server.info.uri);
    });
});
