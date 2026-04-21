import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useAuth } from "../utils/authContext";
import { getHealthProfile, updateHealthProfile } from "../utils/api";

export default function Profile(){

 const { user, token } = useAuth();

 const [age,setAge] = useState("");
 const [bmi,setBmi] = useState("");
 const [diet,setDiet] = useState<"vegetarian"|"non-vegetarian"|null>(null);
 const [allergens,setAllergens] = useState("");

 useEffect(()=>{
  loadProfile();
 },[]);


 const loadProfile = async ()=>{

  const res = await getHealthProfile(user._id,token);

  if(res.profile){

   setAge(res.profile.age?.toString() || "");
   setBmi(res.profile.bmi?.toString() || "");
   setDiet(res.profile.dietaryPreference || null);
   setAllergens(res.profile.allergens?.join(",") || "");

  }

 };


 const saveProfile = async ()=>{

  const result = await updateHealthProfile(

   user._id,

   {
    age: age ? parseInt(age) : undefined,
    bmi: bmi ? parseFloat(bmi) : undefined,
    dietaryPreference: diet || undefined,
    allergens: allergens.split(",").map(a=>a.trim())
   },

   token

  );

  if(result.success){

   Alert.alert("Saved successfully");

  }

 };


 return(

  <ScrollView style={{padding:20}}>

   <Text>Age</Text>
   <TextInput
    value={age}
    onChangeText={setAge}
    style={{borderWidth:1,marginBottom:15,padding:8}}
   />


   <Text>BMI</Text>
   <TextInput
    value={bmi}
    onChangeText={setBmi}
    style={{borderWidth:1,marginBottom:15,padding:8}}
   />


   <Text>Diet</Text>

   <TouchableOpacity onPress={()=>setDiet("vegetarian")}>
    <Text>Vegetarian</Text>
   </TouchableOpacity>

   <TouchableOpacity onPress={()=>setDiet("non-vegetarian")}>
    <Text>Non vegetarian</Text>
   </TouchableOpacity>


   <Text>Allergens (comma separated)</Text>

   <TextInput
    value={allergens}
    onChangeText={setAllergens}
    style={{borderWidth:1,marginBottom:20,padding:8}}
   />


   <TouchableOpacity
    onPress={saveProfile}
    style={{backgroundColor:"#2e7d32",padding:12,borderRadius:8}}
   >

    <Text style={{color:"white",textAlign:"center"}}>

     Save

    </Text>

   </TouchableOpacity>

  </ScrollView>

 );
}