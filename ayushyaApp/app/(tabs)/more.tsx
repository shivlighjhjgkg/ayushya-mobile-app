import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

import { useAuth } from '../../utils/authContext';
import { getAllUsers, getFamily } from '../../utils/database';
import { Family, getHealthProfile } from '../../utils/api';

interface Dosha {
 vata:number;
 pitta:number;
 kapha:number;
}

interface HealthProfile {

 age?:number;

 bmi?:number;

 dietaryPreference?:string;

 allergens?:string[];

 region?:string;

 season?:string;

}

interface MoreProps {
 dosha:Dosha;
 onLogout:()=>void;
}


export default function More({dosha:_dosha,onLogout}:MoreProps){

 const {user,token,logout} = useAuth();

 const router = useRouter();

 const [profile,setProfile] = useState<HealthProfile|null>(null);
 const [family, setFamily] = useState<Family | null>(null);



 const loadProfile = useCallback(async ()=>{

  if(!user || !token) return;

  const res = await getHealthProfile(user._id,token);

  if(res.profile){

   setProfile(res.profile);

  }

 },[user, token]);

 const loadFamily = useCallback(async ()=>{

  if(!user || !token) return;

  const res = await getFamily(user._id, token);

  if(res.success && res.family){

   setFamily(res.family);

  }

 },[user, token]);



 useEffect(()=>{

  loadProfile();
  if (user && token) {
    loadFamily();
  }

 },[loadFamily, loadProfile, user, token]);



 const handleLogout = ()=>{

  logout();

 };



 const handleViewDatabase = async ()=>{

  try{

   const users = await getAllUsers();

   const dbContent = users

   .map(u=>`📧 ${u.email}\nName: ${u.name}`)

   .join('\n\n');


   Alert.alert(

    'Users',

    dbContent || 'empty'

   );

  }

  catch{

   Alert.alert('error');

  }

 };



 return(

 <ScrollView

 style={styles.root}

 contentContainerStyle={styles.scroll}

 >



 <View style={styles.pageHeader}>

  <Text style={styles.pageTitle}>More</Text>

  <Text style={styles.pageSub}>

   Personalisation & settings

  </Text>

 </View>



 {/* family */}

 <View style={styles.card}>

  <Text style={styles.cardTitle}>

   👪 Family

  </Text>

  {family && family.members && family.members.length > 0 ? (
    <>
      <Text style={styles.familyName}>{family.familyName}</Text>
      {family.members.map((m, i) => (
        <View key={i} style={styles.familyItem}>
          <View style={styles.famInfo}>
            <Text style={styles.famName}>
              {m.name}
            </Text>
            <Text style={styles.famDosha}>
              {m.doshaScores ? `Vata ${m.doshaScores.vata} · Pitta ${m.doshaScores.pitta} · Kapha ${m.doshaScores.kapha}` : 'Quiz pending'}
            </Text>
          </View>
          <View
            style={[
              styles.famStatus,
              m.doshaScores ? styles.famOk : styles.famWarn,
            ]}
          >
            <Text
              style={[
                styles.famStatusText,
                m.doshaScores ? styles.famOkText : styles.famWarnText,
              ]}
            >
              {m.doshaScores ? 'Complete' : 'Pending'}
            </Text>
          </View>
        </View>
      ))}
    </>
  ) : (
    <TouchableOpacity
      style={styles.familyEmptyLink}
      onPress={() => router.push('/family' as never)}
    >
      <Text style={styles.familyEmptyText}>
        No family yet · Go to Family tab to create or join →
      </Text>
    </TouchableOpacity>
  )}

 </View>



 {/* personalisation */}

 <View style={styles.card}>

  <Text style={styles.cardTitle}>

   Your Personalisation

  </Text>



  <View style={styles.profileRow}>

   <Text style={styles.profileLabel}>Age</Text>

   <Text style={styles.profileValue}>

    {profile?.age || '-'}

   </Text>

  </View>



  <View style={styles.profileRow}>

   <Text style={styles.profileLabel}>BMI</Text>

   <Text style={styles.profileValue}>

    {profile?.bmi || '-'}

   </Text>

  </View>



  <View style={styles.profileRow}>

   <Text style={styles.profileLabel}>Diet</Text>

   <Text style={styles.profileValue}>

    {profile?.dietaryPreference || '-'}

   </Text>

  </View>



  <View style={styles.profileRow}>

   <Text style={styles.profileLabel}>Allergens</Text>

   <Text style={styles.profileValue}>

    {profile?.allergens?.join(', ') || '-'}

   </Text>

  </View>



  <TouchableOpacity

    onPress={()=>router.push("/profile" as never)}

   style={styles.editBtn}

  >

   <Text style={styles.editText}>

    Edit personalisation

   </Text>

  </TouchableOpacity>


 </View>



 {/* practitioner */}

 <View style={styles.card}>

  <Text style={styles.cardTitle}>

   Practitioner

  </Text>



  <TouchableOpacity

   style={styles.clinicCard}

   onPress={()=>Alert.alert("search clinic")}

  >

   <Text style={styles.clinicIcon}>🏥</Text>

   <Text>

    nearby clinics

   </Text>

  </TouchableOpacity>


 </View>



 {/* account */}

 <View style={styles.card}>

  <Text style={styles.cardTitle}>

   Account

  </Text>



  <Text>

   {user?.email}

  </Text>



  <TouchableOpacity

   style={styles.btnLogout}

   onPress={handleLogout}

  >

   <Text>

    Logout

   </Text>

  </TouchableOpacity>


 </View>



 {/* debug */}

 <View style={styles.card}>

  <TouchableOpacity

   style={styles.btnDebug}

   onPress={handleViewDatabase}

  >

   <Text>

    debug users

   </Text>

  </TouchableOpacity>

 </View>



 </ScrollView>

 );

}



const styles = StyleSheet.create({

 root:{flex:1,backgroundColor:"#f5f9f5"},

 scroll:{padding:16,gap:16},

 pageHeader:{marginBottom:8},

 pageTitle:{fontSize:24,fontWeight:"700"},

 pageSub:{fontSize:12,color:"#888"},



 card:{

  backgroundColor:"#fff",

  padding:16,

  borderRadius:14

 },



 cardTitle:{

  fontWeight:"700",

  marginBottom:12

 },

 familyName:{

  fontSize:13,

  color:"#666",

  fontWeight:"600",

  marginBottom:10

 },

 familyEmptyLink:{

  paddingVertical:12,

  paddingHorizontal:8

 },

 familyEmptyText:{

  fontSize:13,

  color:"#4a9b5f",

  fontWeight:"500"

 },



 familyItem:{

  flexDirection:"row",

  alignItems:"center",

  gap:12,

  marginBottom:12

 },



 famAvatar:{fontSize:26},

 famInfo:{flex:1},

 famName:{fontWeight:"700"},

 famDosha:{fontSize:12,color:"#777"},



 famStatus:{

  paddingHorizontal:8,

  paddingVertical:4,

  borderRadius:8

 },



 famOk:{backgroundColor:"#e8f5ee"},

 famWarn:{backgroundColor:"#fff8e1"},



 famStatusText:{fontSize:11},

 famOkText:{color:"#2d6a4f"},

 famWarnText:{color:"#b7790f"},



 profileRow:{

  flexDirection:"row",

  justifyContent:"space-between",

  marginBottom:10

 },



 profileLabel:{color:"#777"},

 profileValue:{fontWeight:"600"},



 editBtn:{

  marginTop:10,

  backgroundColor:"#e8f5ee",

  padding:10,

  borderRadius:8,

  alignItems:"center"

 },



 editText:{fontWeight:"600"},



 clinicCard:{

  flexDirection:"row",

  gap:10

 },



 clinicIcon:{fontSize:20},



 btnLogout:{

  marginTop:10,

  backgroundColor:"#fdecea",

  padding:10,

  borderRadius:8,

  alignItems:"center"

 },



 btnDebug:{

  backgroundColor:"#eee",

  padding:10,

  borderRadius:8,

  alignItems:"center"

 }

});