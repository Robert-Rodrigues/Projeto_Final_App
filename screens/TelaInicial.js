import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TextInput } from 'react-native';
import { Button } from 'react-native-paper';

const TelaInicial = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authenticationStatus, setAuthenticationStatus] = useState('');

  const handleLogin = () => {
    fetch('https://api-mobile.herokuapp.com/users/')
      .then((response) => response.json())
      .then((data) => {
        const user = data[0];

        if (user.email === email && user.password === password) {
          navigation.navigate('TelaSecundaria');
        } else {
          setAuthenticationStatus('Credenciais inválidas. Tente novamente.');
        }
      })
      .catch((error) => {
        console.error(error);
        setAuthenticationStatus('Erro ao autenticar. Tente novamente mais tarde.');
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.profilePicture}
        />
        <Text style={styles.loginText}>
          Login
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={(text) => setPassword(text)}
        />
        <Button icon="login" mode="contained" onPress={handleLogin}>
          Acessar
        </Button>
        {authenticationStatus ? (
          <Text style={styles.errorText}>{authenticationStatus}</Text>
        ) : null}
      </View>
    </View>
  );
};

export default TelaInicial;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 50,
    marginBottom: 50,
  },
  profilePicture: {
    width: 250,
    height: 250,
    borderRadius: 125,
    marginBottom: 20,
  },
  loginText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    width: 300,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 30, // Adicionado
  },
  errorText: {
    marginTop: 10,
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});
