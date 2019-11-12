const express = require("express");
const app = express();
const port = 3000;
const handlebars = require("handlebars");
const fs = require("fs");
const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const ObjectID = require("mongodb").ObjectID;

// Connection url & Database Name
const url = 'mongodb://localhost:27017';
const dbName = "messages";

// Extraction of encoded form data
app.use(express.urlencoded({extended: false}));

// Homepage for the app
app.get('/', function(req, res){
    res.sendFile(__dirname + '/files/doc-home.html');
});

app.get('/create', function(req, res){
    res.sendFile(__dirname + '/files/doc-create.html');
});

// Creation of new wntry in databse
app.post('/create', function(req, res){

    // Creation of MongoDB Client
    let client = null;
    try{
        client = new MongoClient(url,{useNewUrlParser: true});
        console.log('---> Mongo DB ---> Connection establised with database');
    }
    catch(error){
        console.log('---> Mongo DB ---> Unable to establish connection with database');
        console.log('---> Mongo DB ---> showing error name',error.name);
    }
    
    // Connecting client to database
    client.connect(function(err){
        assert.equal(null, err);
        const db = client.db(dbName);
    
        // extracting form data from body
        let uname = req.body.uname;
        let message = req.body.message;
        // context object for handlebars
        let context = {
            uname, message,
        };

        // Inserting document database
        let promise = db.collection('messages').insertOne(context);
        // handling
        promise.then( function(result){
        
            // send inserted data as html to user
            fs.readFile(__dirname + '/files/doc-created.html',{encoding: 'utf-8'},(err,data)=>{
                let template = handlebars.compile(data);
                let html = template(context);
                res.send(html); 
            });

            // post insertion log
            console.log('---> Mongo DB ---> inserted document',context);
        
            // closing client connection
            client.close();
            console.log('---> Mongo DB ---> Connection closed with database');
        }, function(error){
        
        // displaying error in insertion
        console.log('---> Mongo DB ---> ERROR - document not inserted');
        });
    });    
});

app.get('/read/:option',function(req,res){
    
    // making use of option for 'read' and 'update' operation
    let flag = null;
    if(req.params.option == 'only')
        // for read operation
        flag = 0;
    else if(req.params.option == 'update-null')
        // for displaying items for updation
        flag = 1;
    else if(req.params.option == 'delete')
        // for delete operation
        flag = 2;
    else if((req.params.option).length = 24)
        // form for updation
        flag = 3;

    // creating Mongo DB client
    let client = null;
    try{
        client = new MongoClient(url,{useNewUrlParser: true});
        console.log('---> Mongo DB ---> Connection establised with database');
    }
    catch(error){
        console.log('---> Mongo DB ---> Unable to establish connection with database');
        console.log('---> Mongo DB ---> showing error name',error.name);
        
    // connecting client to database
    client.connect(function(err){
        assert.equal(null, err);
    }
        const db = client.db(dbName);
        let promise = db.collection("messages").find({}).toArray();

        // handling
        promise.then( function(result){
            // post insertion log
            console.log('---> Mongo DB ---> read documents',result);

            // context object for handlebars
            let context = {
                docs: result,
            }

            if(!flag)
                // file to read
                fs.readFile(__dirname + '/files/docs-read.html',{encoding: 'utf-8'},(err,data)=>{
                    let template = handlebars.compile(data);
                    let html = template(context);
                    res.send(html);
                });
            else if(flag == 1)
                // displaying items to choose for updation
                fs.readFile(__dirname + '/files/docs-update.html',{encoding: 'utf-8'},(err,data)=>{
                    let template = handlebars.compile(data);
                    let html = template(context);
                    res.send(html);
                });
            else if(flag == 2)
                // file to delete
                fs.readFile(__dirname + '/files/docs-delete.html',{encoding: 'utf-8'},(err,data)=>{
                    let template = handlebars.compile(data);
                    let html = template(context);
                    res.send(html);
                });
            else
                // form for updation
                fs.readFile(__dirname + '/files/form-update.html',{encoding: 'utf-8'},(err,data)=>{
                    context = { id: req.params.option};
                    let template = handlebars.compile(data);
                    let html = template(context);
                    res.send(html);
                });


            // closing client connection
            client.close();
            console.log('---> Mongo DB ---> Connection closed with database');
        }, function(error){
        
        // displaying error in insertion
        console.log('---> Mongo DB ---> ERROR - document not read');
        });
    });
});

// processing for getting 'object id' for document updation
app.get('/update/:id',function(req,res){
    res.redirect(`/read/${req.params.id}`);
});

app.post('/update/:id',function(req,res){

// update object from form extracted data
let newObject = {
    uname: `${req.body.uname}`,
    message: `${req.body.message}`
};

// creating Mongo DB client
let client = null;
try{
    client = new MongoClient(url,{useNewUrlParser: true});
    console.log('---> Mongo DB ---> Connection establised with database');
}
catch(error){
    console.log('---> Mongo DB ---> Unable to establish connection with database');
    console.log('---> Mongo DB ---> showing error name',error.name);
}

// connecting client to database and updating data
client.connect(function(err){
    assert.equal(null, err);
    const db = client.db(dbName);

    //updating data in database
    let promise = db.collection("messages").
                    findOneAndUpdate({ _id: new ObjectID(`${req.params.id}`) },
                                        { $set: { uname: `${req.body.uname}`,
                                                  message: `${req.body.message}` }
                                        });
                    // find({_id: new ObjectID(`req.params.id`)});
    // handling promise returned from above
    promise.then( function(result){
        
        // post insertion log
        console.log('---> Mongo DB ---> updated document',result);

        // context object for handlebars
        let context = newObject;

        fs.readFile(__dirname + '/files/doc-updated.html',{encoding: 'utf-8'},(err,data)=>{
            let template = handlebars.compile(data);
            let html = template(context);
            res.send(html);
        });

        // closing client connection
        client.close();
        console.log('---> Mongo DB ---> Connection closed with database');
    }, 
    function(error){
    
        // displaying error in insertion
        console.log('---> Mongo DB ---> ERROR - document not updated');
    });
});
});

app.get('/delete/:id',function(req,res){
if(req.params.id == 'null')
    res.redirect('/read/delete');
else{
    
    // creating Mongo DB client
    let client = null;
    try{
        client = new MongoClient(url,{useNewUrlParser: true}); 
        console.log('---> Mongo DB ---> Connection establised with database');
    }
    catch(error){
        console.log('---> Mongo DB ---> Unable to establish connection with database');
        console.log('---> Mongo DB ---> showing error name',error.name);
    }

    // connecting client to database and updating data
    client.connect(function(err){
        assert.equal(null, err);
        const db = client.db(dbName);

        // deleting data from database
        let promise = db.collection("messages").
                        findOneAndDelete( { _id: new ObjectID(`${req.params.id}`)});
        // handling promise returned from above
        promise.then( function(result){
            
            // post insertion log
            console.log('---> Mongo DB ---> deleted document',result);

            res.sendFile(__dirname + '/files/doc-deleted.html');

            // closing client connection
            client.close();
            console.log('---> Mongo DB ---> Connection closed with database');
        }, 
        function(error){
        
            // displaying error in insertion
            console.log('---> Mongo DB ---> ERROR - document not deleted');
        });
    });
} 
});

app.listen(port, () => {
console.log(`Example app listening on port ${port}`);
console.log('----------------------------------');
console.log('CREATING LOGS\n=============');
});