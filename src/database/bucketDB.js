import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import { getMessageApi } from '../discordBot/newMessageCollector.js';
import { parseBucketId } from '../utils/util.js';

dotenv.config();

class BucketManager {
    constructor(uri, dbName, collectionName) {
        this.client = new MongoClient(uri, {
          serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
          },
        });
        this.dbName = dbName;
        this.collectionName = collectionName;
    }

    async connect() {
        await this.client.connect();
        console.log("Connected to MongoDB Atlas!");
    }

    async addNewBucket(bucketId, oldMessage = false) {
        let parsedMsg; // Declare parsedMsg in the broader scope
    
        if (oldMessage) {
            const {serverId, channelId, memberId} = parseBucketId(bucketId);
            const msg = await getMessageApi(serverId, channelId, memberId, 0)
            parsedMsg = JSON.stringify(msg, null, 2); // Assign value to parsedMsg
            console.log(`parsedMsg when oldMessage: ${oldMessage}: `, parsedMsg);
        } else {
            parsedMsg = []; // Assign value to parsedMsg
            console.log(`parsedMsg when oldMessage: ${oldMessage}: `, parsedMsg);
        }
    
        const bucket = {id: bucketId, messages: parsedMsg};
        const db = this.client.db(this.dbName);
        const bucketCollection = db.collection(this.collectionName);
        await bucketCollection.insertOne(bucket);
        console.log("Bucket added:", bucket);
    }    

    async updateBucket(bucketId, updatedData) {
        const db = this.client.db(this.dbName);
        const bucketCollection = db.collection(this.collectionName);
        await bucketCollection.updateOne({ id: bucketId }, { $set: updatedData });
        console.log("Bucket updated:", bucketId);
    }

    async deleteBucket(bucketId) {
        const db = this.client.db(this.dbName);
        const bucketCollection = db.collection(this.collectionName);
        await bucketCollection.deleteOne({ id: bucketId });
        console.log("Bucket deleted:", bucketId);
    }

    async deleteAllBuckets() {
        const db = this.client.db(this.dbName);
        const bucketCollection = db.collection(this.collectionName);
        await bucketCollection.deleteMany({});
        console.log("All buckets deleted.");
    }

    async getBucket(bucketId) {
        const db = this.client.db(this.dbName);
        const bucketCollection = db.collection(this.collectionName);
        const bucket = await bucketCollection.findOne({ id: bucketId });
        return bucket;
    }

    async getAllBuckets() {
        const db = this.client.db(this.dbName);
        const bucketCollection = db.collection(this.collectionName);
        const buckets = await bucketCollection.find({}).toArray();
        return buckets;
    }

    async addMessage(bucketId, message) {
        const db = this.client.db(this.dbName);
        const bucketCollection = db.collection(this.collectionName);
    
        const existingBucket = await bucketCollection.findOne({ id: bucketId });
    
        if (!existingBucket) {
            console.log(`Bucket with id ${bucketId} does not exist. Creating a new bucket...`);
            await this.addNewBucket(bucketId);
        }
    
        await bucketCollection.updateOne(
            { id: bucketId },
            { $push: { messages: message } }
        );
    
        console.log("Message added to bucket...");
    }

    async getMessages(bucketId) {
        const db = this.client.db(this.dbName);
        const bucketCollection = db.collection(this.collectionName);
        
        const bucket = await bucketCollection.findOne({ id: bucketId });
        if (bucket) {
            return bucket.messages;
        } else {
            return [];
        }
    }

    async updateMessage(bucketId, oldMessage, newMessage) {
        const db = this.client.db(this.dbName);
        const bucketCollection = db.collection(this.collectionName);
        
        await bucketCollection.updateOne(
            { id: bucketId, messages: oldMessage },
            { $set: { "messages.$": newMessage } }
        );
        
        console.log("Message updated in bucket:", bucketId);
    }

    async deleteMessage(bucketId, message) {
        const db = this.client.db(this.dbName);
        const bucketCollection = db.collection(this.collectionName);
        
        await bucketCollection.updateOne(
            { id: bucketId },
            { $pull: { messages: message } }
        );
        
        console.log("Message deleted from bucket:", bucketId);
    }
    
    async deleteAllMessages(bucketId) {
        const db = this.client.db(this.dbName);
        const bucketCollection = db.collection(this.collectionName);
        
        await bucketCollection.updateOne(
            { id: bucketId },
            { $set: { messages: [] } }
        );
        
        console.log("All messages deleted from bucket:", bucketId);
    }

    async close() {
        await this.client.close();
        console.log("Disconnected from MongoDB Atlas.");
    }
}

// MongoDB URI and database/collection names
const uri = process.env.MONGODB_DEV_URI;
const bucket_dbName = process.emv.BUCKET_DEV_DB_NAME
const bucket_collectionName = process.env.BUCKET_DEV_COLLECTION_NAME

// Create instances of the managers
const bucketManager = new BucketManager(uri, bucket_dbName, bucket_collectionName);

export default bucketManager;
