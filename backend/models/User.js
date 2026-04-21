const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
{
 name:{
  type:String,
  required:true,
  trim:true
 },

 email:{
  type:String,
  required:true,
  unique:true,
  lowercase:true
 },

 password_hash:{
  type:String,
  required:true,
  select:false
 },

 familyId:{
  type:mongoose.Schema.Types.ObjectId,
  ref:'Family',
  default:null
 },

 created_at:{
  type:Date,
  default:Date.now
 }

});



// hash password
UserSchema.pre('save', async function(){

 if(!this.isModified('password_hash')) return;

 const salt = await bcrypt.genSalt(10);

 this.password_hash = await bcrypt.hash(
  this.password_hash,
  salt
 );

});



// compare password
UserSchema.methods.comparePassword = async function(password){

 return bcrypt.compare(
  password,
  this.password_hash
 );

};



// CASCADE DELETE HEALTH PROFILE
UserSchema.pre('findOneAndDelete', async function(next){

 try{

  const HealthProfile = require('./HealthProfile');

  const user = await this.model.findOne(
   this.getFilter()
  );

  if(user){

   await HealthProfile.deleteOne({

    userId:user._id

   });

   console.log(
    "Deleted health profile for user:",
    user._id
   );

  }

  next();

 }

 catch(err){

  next(err);

 }

});



module.exports = mongoose.model(
 'User',
 UserSchema
);