const { MongoClient, ObjectId } = require('mongodb');
class CosmosService {

  constructor(dbName, collectionName) {
    this.connectionString = process.env.COSMOS_CONNECTION_STRING;
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.client = new MongoClient(this.connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  
  async getById(id) {
    try{
      await this.connect();
      const query = { _id: new ObjectId(id) };
      return [await this.collection.findOne(query)];
    }
    catch (error) {
      throw new Error(`Error occured in getById: ${error.message}`);
    }
  }

  async deleteAll() {
    try {
      await this.connect();
      let response = await this.collection.deleteMany({});
      return response.acknowledged; 
    } catch (error) {
      throw new Error(`Error occurred in deleteAll: ${error.message}`);
    }
  }

  async getAll(){
    try{
      await this.connect();
      let response =  await this.collection.find({}).toArray();
      return response;
    }
    catch (error) {
      throw new Error(`Error occured in getAll: ${error.message}`);
    }

  }

  async getByTableId(tableId) {
    try{
      await this.connect();
      const query = { table_id: tableId };
      const result = await this.collection.find(query).toArray();
      return result;
    } 
    catch (error) {
      throw new Error(`Error occured in getById: ${error.message}`);
    }
  }

  async connect() {
    if (!this.client?.db) {
      await this.client.connect();
    }
  
    this.db = this.client.db(this.dbName);
    this.collection = this.db.collection(this.collectionName);
  }
  

  async createItem(items) {
    try {
      await this.connect();
      const result = await this.collection.insertMany(items);

      const insertedItems = items.map((item, index) => ({
        ...item,
        _id: result.insertedIds[index]
      }));

      return insertedItems;
      
    } catch (error) {
      throw new Error(`Error occured in getById: ${error.message}`);
    }

  }

  async getByName(guestName) {
    try {
      await this.connect();
      const query = { "guests.name": guestName };
      const result = await this.collection.find(query).toArray();
      return result;
    } catch (error) {
      throw new Error(`Error occured in getById: ${error.message}`);
    }
  }

  async updateTable(id,arrayFilters){
    try {
      await this.connect();
      const result = await this.collection.updateOne(
        { _id: new ObjectId(String(id)) }, 
        { $set: { "guests.$[guest].check_in": true } },
        {
          arrayFilters: [
            {
              "guest.name": {
                $in: arrayFilters
              }
            }
          ]
        }
      );
      return result;
    } catch (error) {
      throw new Error(`Error occured in getById: ${error.message}`);
    }
  }

  async userCheckIn(guestsName){
    try {
      await this.connect();
      const result = await this.collection.updateMany(
        { "guests.name": { $in: guestsName } },
        { $set: { "guests.$[guest].check_in": true } },
        {
          arrayFilters: [
            {
              "guest.name": {
                $in: guestsName
              }
            }
          ]
        }
      );
      return result;
    } catch (error) {
      throw new Error(`Error occured in check-in: ${error.message}`);
    }
  }

  async kidsFilter(isKid) {
    try {
      await this.connect();
      let response =  await this.collection.find({}).toArray();
      let filtered=  response.map(item => {
        let kids = item.guests.filter(guest => guest.is_kid === isKid);
        return {
          table_id: item.table_id,
          guests: kids
        };
      });
      return filtered;
    } catch (error) {
      throw new Error(`Error occured in getAllKids: ${error.message}`);
    }
  }

  async close() {
    await this.client.close();
  }
}

module.exports = {CosmosService};
