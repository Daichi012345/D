import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { UserContext } from '../contexts/UserContext';
import { API_BASE_URL } from '@env';

const MyPageScreen = ({ navigation }) => {
  const { user, setUser } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const handleLogout = () => {
    Alert.alert('ログアウトしますか？', '', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト',
        style: 'destructive',
        onPress: () => {
          setUser(null);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedUser),
      });

      if (!response.ok) {
        throw new Error('サーバーへの保存に失敗しました');
      }

      const data = await response.json();
      setUser(data.user); 
      setIsEditing(false);
      console.log('保存されたアレルギー:', editedUser.allergy);

      Alert.alert('保存しました');
    } catch (error) {
      console.error('❌ 保存エラー:', error);
      Alert.alert('エラー', 'ユーザー情報の保存に失敗しました');
    }
  };


  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.info}>ユーザー情報が見つかりません</Text>
      </View>
    );
  }

  const renderField = (label, key) => (
    <>
      <Text style={styles.label}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={editedUser[key]}
          onChangeText={(text) => setEditedUser({ ...editedUser, [key]: text })}
        />
      ) : (
        <Text style={styles.info}>{user[key] || 'なし'}</Text>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>マイページ</Text>
      <View style={styles.infoBox}>
        {renderField('名前：', 'name')}
        {renderField('メール：', 'email')}
        {renderField('年齢：', 'age')}
        {renderField('性別：', 'gender')}
        {renderField('アレルギー：', 'allergy')}
      </View>

      {isEditing ? (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.logoutText}>保存する</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
          <Text style={styles.logoutText}>編集する</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>ログアウト</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FAF9F6', 
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    textAlign: 'center',
    marginBottom: 24,
    color: '#4E342E',
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    color: '#5D4037',
  },
  info: {
    fontSize: 16,
    color: '#3E2723',
    marginBottom: 6,
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  editButton: {
    backgroundColor: '#81C784',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: '#FF7043',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 17,
  },
});

export default MyPageScreen;
