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
        mongoDBClient = new MongoClient(connectionString);
        console.log('Connecting to MongoDB...');
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
    await mongoDBCclient.close();
    console.log('Connection to MongoDB closed...');
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
        // Setup the connection info.
        oracleDBConnection = await oracledb.getConnection({
            user: username,
            password: password,
            connectString: connectionString
        });
        console.log('Connecting to OracleDB...');
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
        await connection.close();
        console.log('Connection to OracleDB closed...');
    }
}