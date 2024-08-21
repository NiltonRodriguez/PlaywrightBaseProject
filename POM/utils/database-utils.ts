import oracledb from 'oracledb';
import { MongoClient } from "mongodb";


/**
 * **Description**
 * 
 * Establish the connection to a MongoDB database and return the connection.
 * 
 * @param connectionString 
 * @returns MongoClient
 */

export async function connectToMongoDB(connectionString: string) {
    let mongoDBClient;
    try {
        console.log('Connecting to MongoDB...');
        mongoDBClient = new MongoClient(connectionString, { useUnifiedTopology: true });
        await mongoDBClient.connect();
        console.log('Connected to MongoDB established...');
    } catch (error) {
        console.error('Error trying to connect to MongoDB:', error);
        // If the connection fails, raise an error to make the test fail.
        throw error;
    }

    return mongoDBClient;
}



/**
 * **Description**
 * 
 * Check if the connection to MongoDB is active and then close the connection.
 * 
 * @param MongoClient
 */

export async function closeMongoDBConnection(mongoDBCclient: MongoClient) {
    if (mongoDBCclient) {
        try {
            await mongoDBCclient.close();
            console.log('Connection to MongoDB closed...');
        } catch (error) {
            console.error('Error closing MongoDB connection:', error);
            throw error;
        }
    }
}

/**
 * **Description**
 * 
 * Establish the connection to a OracleDB database and return the connection.
 * 
 * @param username 
 * @param password 
 * @param connectionString 
 * @returns oracle.Connection
 */
export async function connectToOracleDB(username: string, password: string, connectionString: string) {
    let oracleDBConnection: oracledb.Connection;
    oracledb.fetchAsString = [ oracledb.CLOB ]
    try {
        console.log('Connecting to OracleDB...');
        // Setup the connection info.
        oracleDBConnection = await oracledb.getConnection({
            user: username,
            password: password,
            connectString: connectionString
        });
        console.log('Connection to OracleDB established...');
    } catch (error) {
        console.error('Error trying to connect to OracleDB:', error);
        // If the connection fails, raise an error to make the test fail.
        throw error;
    }

    return oracleDBConnection;
}

/**
 * **Description**
 * 
 * Check if the connection to OracleDB is active and then close the connection.
 * 
 * @param connection 
 */
export async function closeOracleDBConnection(connection: oracledb.Connection) {
    if (connection) {
        try {
            await connection.close();
            console.log('Connection to OracleDB closed...');
        } catch (error) {
            console.error('Error closing OracleDB connection:', error);
            throw error;
        }
    }
}
