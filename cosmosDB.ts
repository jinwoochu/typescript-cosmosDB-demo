import {Client, Database, Collection, StoreMode} from "documentdb-typescript";

var config = require("/tls/configDB");

var HttpStatusCodes = { NOTFOUND: 404 };
var databaseUrl = `dbs/${config.database.id}`;
var collectionUrl = `${databaseUrl}/colls/${config.collection.id}`;

// viewAvailableDB(config.endpoint, config.primaryKey);
// viewCollections(config.endpoint, config.primaryKey);
// collectionFunc(config.endpoint, config.primaryKey);
// setNviewCollInfo(config.endpoint, config.primaryKey);
// storeDoc(config.endpoint, config.primaryKey);
// findDoc(config.endpoint, config.primaryKey);
// iterateQueryResult(config.endpoint, config.primaryKey);


// DB 목록 보기 
async function viewAvailableDB(url, masterKey) {
    var client = new Client(url, masterKey);
 
    // enable logging of all operations to the console
    client.enableConsoleLog = true;
 
    // open the connection and print a list of IDs
    await client.openAsync();
    var dbs = await client.listDatabasesAsync();
    console.log(dbs.map(db => db.id));
 
    // dump the account information
    console.log(await client.getAccountInfoAsync());
 
    // unnecessary unless you expect new clients
    // to reopen the connection:
    var tmp = 0;
    client.close();
}

// 콜렉션 목록 보기 
async function viewCollections(url, masterKey) {
    var client = new Client(url, masterKey);
    var db = new Database("test1DB", client);
 
    // ... or this, which creates a new client
    // but reuses the connection:
    var db2 = new Database("sample", url, masterKey);
 
    // create the database if necessary
    await db.openOrCreateAsync();
 
    // ... or not at all (fails if not found)
    // await db.openAsync();
 
    // print a list of collection IDs
    var colls = await db.listCollectionsAsync();
    console.log(colls.map(c => c.id));
 
    // delete the database

    var tml = 0;
    
    await db.deleteAsync();
}


// 콜렉션 생성 및 지우기
async function collectionFunc(url, masterKey) {
    var client = new Client(url, masterKey);
    var db = new Database("sample", client);
 
    // these are all the same:
    var coll = new Collection("test", db); // sample이라는 DB에 연결된 test라는 콜렉션 생성
    
    // create everything if necessary
    await coll.openOrCreateDatabaseAsync(); // 콜렉션을 그냥 열거나 없으면 추가한다. 만약 연결된 db가 없으면 db를 만들어서 콜렉션을 추가함.
    // await coll.openOrCreateAsync();
    
    // delete the collection
    var t =1 ;
    await coll.deleteAsync();
}



// 처리량 수준 설정 && 정보 가져오기 
async function setNviewCollInfo(url, masterKey) {
    var client = new Client(url, masterKey);
    var coll = new Collection("test", "sample", client);
    await coll.openOrCreateDatabaseAsync();
 
    // set the offer throughput
    await coll.setOfferInfoAsync(500);
    
    // dump the new offer information
    console.log(await coll.getOfferInfoAsync());
    var t =1 ;
    var t =2 ;
}


// document 저장 및 제거
async function storeDoc(url, masterKey) {
    var client = new Client(url, masterKey);
    client.enableConsoleLog = true;
    var coll = new Collection("test", "sample", client);
    await coll.openOrCreateDatabaseAsync();
 
    // create a document (fails if ID exists),
    // returns document with meta properties
    var doc = { id: "abc", foo: "bar" };
    doc = await coll.storeDocumentAsync(doc, StoreMode.CreateOnly);

    // update a document (fails if not found)
    doc.foo = "baz";
    doc = await coll.storeDocumentAsync(doc, StoreMode.UpdateOnly);
 
    // update a document if not changed in DB,
    // using _etag property (which must exist)
    doc.foo = "bla";
    // doc = await coll.storeDocumentAsync(doc, StoreMode.UpdateOnlyIfNoChange); // 정당하게 메소드로 변환되지 않은 경우를 체크해서 에러를 낸다.
    
    // upsert a document (in parallel, without errors)
    var doc2 = { id: "abc", foo: "new value" };
    var doc3 = { id: "not defined", foo: "bar" };
    await Promise.all([
        coll.storeDocumentAsync(doc2, StoreMode.Upsert),  // default : 그냥 해당 id가 없으면 insert 있으면 update인듯.
        coll.storeDocumentAsync(doc3, StoreMode.Upsert)
    ]);
 
     // document Object로 지울 수 있음. 못 찾으면 에러난다.
    await coll.deleteDocumentAsync(doc);
  
    // ID로 지울 수 있음. 못 찾으면 에러난다.
    var t =1 ;
    // await coll.deleteDocumentAsync("abc");
}


// document 찾기
async function findDoc(url, masterKey) {
    var coll = await new Collection("test", "sample", url, masterKey)
        .openOrCreateDatabaseAsync();
 
    // check if a document with given ID exists
    // (uses "count(1)" aggregate in a query)
    var exists = coll.existsAsync("abc");
 
    // check if a document with given properties exists
    // (exact match, also uses "count(1)" aggregate)
    var customerExists = coll.existsAsync({
        isCustomer: true,
        customerID: "1234"
    })
 
    // retrieve a document by ID (fails if not found)
    var doc = await coll.findDocumentAsync("abc"); // 1개만 찾기.

 
    // retrieve a document with given properties
    // (exact match, fails if not found, takes
    // newest if multiple documents match)
    try {
        var user = await coll.findDocumentAsync({ // 1개만 찾기
            foo: "new value"
        });
        console.log(`Found ${user.foo}: ${user.id}`);
    }
    catch (err) {
        console.log("User not found");
    }
 
    // find a set of documents (see below)
    var stream = coll.queryDocuments();  // 아무것도 안 적으면 모두 찾음
    var stream2 = coll.queryDocuments("select * from c");  // 이것도 모두 찾는거임.
    var stream3 = coll.queryDocuments({     
        query: "select * from c where c.foo = @foo",        // 쿼리를 이용할 수 있음.
        parameters: [
            { name: "@foo", value: "bar" }
        ]
    });
    var t = 1;

    console.log("stream ::", stream.forEach(async val => await console.log(val, "stream에서 출력했습니다.\n")) )
    
    console.log("stream2 ::", stream2.forEach(val => console.log(val, "stream2에서 출력했습니다.\n")))
    
    console.log("stream3 ::", stream3.forEach(val => console.log(val, "stream3에서 출력했습니다.\n")))
}




// 쿼리 결과 iterate 걸기 
async function  iterateQueryResult(url, masterKey) {
    var coll = await new Collection("test", "sample", url, masterKey)
        .openOrCreateDatabaseAsync();
 
    // load all documents into an array
    var allDocs = await coll.queryDocuments().toArray();
    var tmp0 = allDocs[0].id
    var tmp1 = allDocs[1].id

    // 이런식으로 쓸 필요는 없지만 스트림 형태에서 필요한 것만 빼 쓰기 때문에 빠를것 같음. 타입 힌트를 줘야 프로퍼티에 접근이 가능하다.
    type FooResult = { id: string, foo: string, _ts:number };
    var stream = coll.queryDocuments<FooResult>("select * from c");
    while (true) {
        var { done, value } = await stream.next();
        if (done) break;
        console.log(value.foo);
    }
 
    // 필요한 경우 스트림을 시작 부분으로 명시적으로 재설정합니다.
    await stream.resetAsync();
 
    // typescript 2.3부터 for of에 await를 쓸 수 있습니다.
    for await (const doc of stream) {
        console.log(doc.foo);
    }
 
    // forEach를 써도 됩니다. 이것도 await가 붙어야됩니다.
    await stream.reset().forEach(doc => {
        console.log(doc.foo);
    });


    await stream.resetAsync();

    // ... or map all results to another array
    var ids = await stream.mapAsync(doc => [doc.id, doc.foo]);
    var tmp= 1;
    console.log(ids);
 
    // use `top 1` to get only the newest time stamp
    var newest = await coll.queryDocuments<FooResult>(
        "select top 1 c._ts from c order by c._ts desc")
        .read();
    if (!newest)
        console.log("No documents");
    else
        console.log("Last change " + (Date.now() / 1000 - newest._ts) + "s ago");
 

    // ... or without `await`:
    coll.queryDocuments<FooResult>(
        "select top 1 c._ts from c order by c._ts desc")
        .read()
        .then(newest => {
            if (!newest) console.log("No documents");
            else console.log("Last change", newest);
        });
}


