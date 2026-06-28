export const findOne = async ({ model, filter, select = "", options = {} }) => {
  const query = await model.findOne(filter).select(select).populate(options.populate);

  if (options.populate) {
    query.populate(options.populate);
  }

  if (options.lean) {
    query.lean();
  }
  const doc = await query;
  return doc;
};

export const find = async ({ model, filter={}, select = "", options = {} }) => {
  const query = await model.find(filter).select(select).populate(options.populate);

  if (options.populate) {
    query.populate(options.populate);
  }

  if (options.lean) {
    query.lean();
  }
  const doc = await query;
  return doc;
};



export const create = async({model,data,options={validateBeforeSave:true}})=>{
    const docs =  model.create(Array.isArray(data)?data:[data], options)
    return docs
}