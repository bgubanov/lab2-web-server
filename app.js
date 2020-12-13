const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const request = require('request');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const urlMongo = 'mongodb+srv://mongo:mongo@cluster0.fpbxd.mongodb.net/<Cluster0>?retryWrites=true&w=majority'
const apiKey = 'd136e52c1f0eee76445085fa375a3f40';
const baseURL = 'https://api.openweathermap.org/data/2.5';

app.use(bodyParser.urlencoded({ extended: true }));

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
    var url = encodeURI(`${baseURL}/weather?q=${req.query.q}&appid=${apiKey}&units=metric`)
    console.log(`GET ${url}`)
    request.get(url, (err, response, body) => {
        return formRes(res, err, body);
    });
});

app.get('/weather/coordinates', (req, res) => {
    var url = encodeURI(`${baseURL}/weather?lat=${req.query.lat}&lon=${req.query.lon}&appid=${apiKey}&units=metric`)
    console.log(`GET ${url}`)
    request.get(url, (err, response, body) => {
        return formRes(res, err, body);
    });
});

app.post('/favourites', (req, res) => {
    console.log("POST /weather/favourites")
    db = global.DB;
    a = db.collection('cities').insertOne(req.body, (err, results) => {
        formRes(res, err, err ? null : results.ops[0])
    });
});


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
    console.log("DELETE /weather/favourites")
    db = global.DB;
    db.collection('cities').find({}).toArray((err, items) => {
        id = items[req.body.num]._id;
        ObjectId = require('mongodb').ObjectID;
        details = { '_id': new ObjectId(id) };
        db.collection('cities').deleteOne(details, (err, item) => {
            formRes(res, err, JSON.stringify('Note ' + id + ' deleted!'));
        });
    });
});


function formRes(res, err, ok) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('content-type', 'application/json; charset=utf-8');
    if(err) {
        return res.status(500).send({message: err});
    }
    return res.send(ok);
}

module.exports = app
