import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { API_BASE_URL } from '@env';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [allergy, setAllergy] = useState('');

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('入力エラー', '名前・メール・パスワードを入力してください');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          age: Number(age),
          gender: gender.trim(),
          allergy: allergy.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('登録完了', 'ログインしてください');
        navigation.navigate('Login');
      } else {
        Alert.alert('登録失敗', data.message || 'サーバーエラー');
      }
    } catch (error) {
      console.error('登録エラー:', error);
      Alert.alert('通信エラー', 'もう一度お試しください');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>ユーザー登録</Text>

          <TextInput
            placeholder="名前"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            placeholder="メールアドレス"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="パスワード"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            placeholder="年齢"
            style={styles.input}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
          <TextInput
            placeholder="性別（例：男性 / 女性 / その他）"
            style={styles.input}
            value={gender}
            onChangeText={setGender}
          />
          <TextInput
            placeholder="アレルギー（例：卵, 乳）"
            style={styles.input}
            value={allergy}
            onChangeText={setAllergy}
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>登録する</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>すでにアカウントをお持ちですか？ログイン</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FAF9F6', 
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#4E342E',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    backgroundColor: '#81C784', 
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 17,
  },
  link: {
    color: '#3B82F6',
    marginTop: 20,
    textAlign: 'center',
    fontSize: 15,
  },
});



export default RegisterScreen;
