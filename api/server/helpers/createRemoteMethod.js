module.exports = properties => {
  validateProperties(properties);
  const {
    model,
    name,
    accepts,
    description,
    httpOptions,
    notes
  } = properties;
  model.remoteMethod(name, {
    accepts: [
      {
        arg: 'request',
        type: 'object',
        http: {
          source: 'req',
        },
      },
      {
        arg: 'response',
        type: 'object',
        http: {
          source: 'res',
        },
      },
      ...accepts
    ],
    description,
    http: httpOptions,
    notes
  });
};

const validateProperties = properties => {
  [
    'model',
    'name',
    'accepts',
    'description',
    'httpOptions'
  ].forEach(property => {
    if (!properties[property]) {
      throw `Invalid Remote method definition. Missing ${property}`;
    }
  });
};
