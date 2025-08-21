'use strict'

const accountRegex = /^[A-Za-z0-9]+$/;

const rules = {
    idRule: {
        id: { 
            type: 'int' , 
            trim:true , 
            min: 1
        }   
    } ,

    contentRule: {
        content: { 
            type: 'string' ,
            required: true , 
            trim: true , 
            min: 1 , 
            max: 40 
        }
    } ,

    accountRule: {
        username: {
            type: 'string',
            required: true,
            trim: true,
            min: 1,
            max: 20,
            format: accountRegex,
        },
        password: {
            type: 'string',
            required: true,
            trim: true,
            min: 4,
            max: 20,
            format: accountRegex,
        },
    }

}

module.exports = rules;