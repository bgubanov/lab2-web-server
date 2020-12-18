const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const request = require('request');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const urlMongo = 'mongodb+srv://mongo:mongo@cluster0.fpbxd.mongodb.net/<Cluster0>?retryWrites=true&w=majority'
const apiKey = 'd136e52c1f0eee76445085fa375a3f40';
const baseURL = 'https://api.openweathermap.org/data/2.5';

app.use(bodyParser.urlencoded({extended: true}));

MongoClient.connect(urlMongo, (err, database) => {
    if (err) {
        return console.log(err)
    }

    global.DB = database.db();
    console.log("started")
    app.options('*', (req, res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Allow-Methods', '*');
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.send('ok');
    });

    app.listen(port, () => {
        console.log('We are live on ' + port);
    });
})

app.get('/weather/city', (req, res) => {
    const url = encodeURI(`${baseURL}/weather?q=${req.query.q}&appid=${apiKey}&units=metric`);
    console.log(`GET ${url}`)
    return getWeather(req, res, url);
});

app.get('/weather/coordinates', (req, res) => {
    request.get(`${baseURL}/weather?lat=${req.query.lat}&lon=${req.query.lon}&appid=${apiKey}`, (err, response, body) => {
        return formRes(res, err, body);
    });
});

function getWeather(req, res, url) {
    request.get(url, (err, response, body) => {
        db = global.DB;
        try {
            const idInt = JSON.parse(body).id.toString()
            const id = {"id": `${idInt}`}//JSON.parse(`{"id": "${idInt}"}`)
            console.log(id)
            const cityName = JSON.parse(body).name
            db.collection('cities').find({}).toArray((err, items) => {
                console.log(items)
                for (item of items) {
                    if (item.id === idInt) {
                        const error = `Город "${cityName[0].toUpperCase() + cityName.slice(1)}" уже был добавлен в избранное`
                        console.log(error)
                        return formRes(res, error, null)
                    }
                }
                a = db.collection('cities').insertOne(id);
                return formRes(res, err, body);
            })
        } catch (e) {
            const error = `Город "${req.query.q}" не найден`
            return formRes(res, error, null)
        }
    });
}

function justGetWeather(id) {
    return formRes(res, err, body);
}
/*app.post('/favourites', (req, res) => {
    console.log("POST /weather/favourites")
    db = global.DB;
    a = db.collection('cities').insertOne(req.query.q, (err, results) => {
        formRes(res, err, err ? null : results.ops[0])
    });
});*/

app.get('/favourites', (req, res) => {
    console.log("GET /weather/favourites")
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('content-type', 'application/json; charset=utf-8');
    db = global.DB;
    db.collection('cities').find({}).toArray((err, items) => {
        results = null;
        if (!err) {
            results = [];
            console.log(items)
            for (item of items) {
                results.push(item.id)
            }
            console.log(results)
            const ids = results.toString();
            const url = encodeURI(`${baseURL}/group?id=${ids}&appid=${apiKey}&units=metric`);
            console.log(url)
            request.get(url, (err, response, body) => {
                return formRes(res, err, body);
            });
        }
    });
});

app.delete('/favourites', (req, res) => {
    console.log("DELETE /favourites")
    db = global.DB;
    db.collection('cities').find({}).toArray((err, items) => {
        console.log(req.query)
        let id = req.query.id.toString();
        let details = {'id': id};
        db.collection('cities').deleteOne(details, (err, item) => {
            const len = typeof item === "undefined" ? items.length : items.length - 1
            formRes(res, err, len);
        });
    });
});


function formRes(res, err, ok) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('content-type', 'application/json; charset=utf-8');
    if (err) {
        return res.status(500).send({message: err});
    }
    return res.send(ok);
}

function urlRes(res, err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('content-type', 'application/json; charset=utf-8');
    if (err) {
        return res.status(500).send({message: err});
    }
    return res;
}

module.exports = app
