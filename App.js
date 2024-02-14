import React, { useState } from "react";
import { StyleSheet, Text, View, TextInput, Button, Alert, ScrollView } from "react-native";

// Define the alphabet for the Hill Cipher
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Function to convert characters to numeric values
const charToNumeric = (char) => {
  return ALPHABET.indexOf(char.toUpperCase());
};

// Function to convert numeric values to characters
const numericToChar = (num) => {
  return ALPHABET.charAt(num % ALPHABET.length);
};

// Function to validate and convert the key text input to a numeric key matrix
const validateAndConvertKey = (keyText) => {
  // Check if the keyText is empty
  if (keyText.trim() === "") {
    Alert.alert("Key cannot be empty.");
    return null;
  }

  // Remove spaces and convert to uppercase
  keyText = keyText.replace(/[^A-Za-z]/g, "").toUpperCase();

  // Check if the key length is a perfect square
  const keyLength = Math.sqrt(keyText.length);
  if (!Number.isInteger(keyLength)) {
    Alert.alert(
      "Error",
      "Key length must be a perfect square and accepts only letters."
    );
    return null;
  }

  // Convert the key text to a numeric matrix
  let numericKey = [];
  for (let i = 0; i < keyLength; i++) {
    numericKey.push([]);
    for (let j = 0; j < keyLength; j++) {
      const char = keyText.charAt(i * keyLength + j);
      numericKey[i].push(charToNumeric(char));
    }
  }
  //The multiplicative inverse of a modulo m exists if and only if a and m are coprime (i.e., if gcd(a, m) = 1).
  // Check if the key matrix has an inverse modulo 26
  const det = determinant(numericKey);
  const detMod26 = mod(det, 26);
  if (gcd(detMod26, 26) !== 1) {
    Alert.alert("Error", "Key matrix has no inverse modulo 26.");
    return null;
  }

  return numericKey;
};

// Function to calculate the determinant of a matrix
const determinant = (matrix) => {
  // Check if the matrix is square
  if (matrix.length !== matrix[0].length) {
    throw new Error("Matrix must be square to calculate determinant.");
  }

  // Base case for 2x2 matrix
  if (matrix.length === 2) {
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  }

  //Recursive Calculation for Larger Matrices
  let det = 0;
  for (let i = 0; i < matrix.length; i++) {
    // Calculate the cofactor matrix
    const cofactor = [];
    for (let j = 1; j < matrix.length; j++) {
      cofactor[j - 1] = [];
      for (let k = 0; k < matrix.length; k++) {
        if (k !== i) {
          cofactor[j - 1].push(matrix[j][k]);
        }
      }
    }

    // Calculate the determinant recursively
    det += Math.pow(-1, i) * matrix[0][i] * determinant(cofactor);
  }
  return det;
};

// Function to calculate the gcd of two numbers
const gcd = (a, b) => {
  if (b === 0) {
    return a;
  }
  return gcd(b, a % b);
};

// in a way that ensures the result is always non-negative
// Function to calculate modulo of two numbers
const mod = (a, b) => {
  return ((a % b) + b) % b;
};

//////////// for key inverse ////////////////
// Function to calculate the modular multiplicative inverse of a number
const modInverse = (a, m) => {
  a = ((a % m) + m) % m;
  for (let x = 1; x < m; x++) {
    if ((a * x) % m === 1) {
      return x;
    }
  }
  return -1;
};

//modified
const matrixInverse = (matrix) => {
  // Find the determinant of the matrix
  const det = determinant(matrix);

  // Find the modular multiplicative inverse of the determinant modulo 26
  const detMod26 = mod(det, 26);
  const detInverse = modInverse(detMod26, 26);

  // Calculate the adjugate matrix
  const adjugateMatrix = [];
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if (!adjugateMatrix[j]) {
        adjugateMatrix[j] = [];
      }
      const cofactor = getCofactor(matrix, i, j);
      const sign = (i + j) % 2 === 0 ? 1 : -1;
      const cofactorDetMod26 = mod(determinant(cofactor), 26);
      adjugateMatrix[j].push(mod(sign * cofactorDetMod26 * detInverse, 26));
    }
  }
  const inverseMatrix = adjugateMatrix;
  return adjugateMatrix;
};

// inverse for 2x2 matrix
const matrixInverse2x2 = (matrix) => {
  // Calculate the determinant of the 2x2 matrix
  const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

  // Calculate the modular multiplicative inverse of the determinant modulo 26
  const detMod26 = mod(det, 26);
  const detInverse = modInverse(detMod26, 26);

  // Calculate the inverse matrix
  const inverseMatrix = [
    [mod(matrix[1][1] * detInverse, 26), mod(-matrix[0][1] * detInverse, 26)],
    [mod(-matrix[1][0] * detInverse, 26), mod(matrix[0][0] * detInverse, 26)],
  ];

  return inverseMatrix;
};

// Function to calculate the cofactor of a matrix element
const getCofactor = (matrix, row, col) => {
  const cofactor = [];
  for (let i = 0; i < matrix.length; i++) {
    if (i !== row) {
      cofactor.push([]);
      for (let j = 0; j < matrix.length; j++) {
        if (j !== col) {
          cofactor[cofactor.length - 1].push(matrix[i][j]);
        }
      }
    }
  }
  return cofactor;
};
///////////////////////////

// Function to encrypt plaintext using Hill Cipher algorithm
const encryptHillCipher = (plaintext, keyMatrix) => {
  // Convert plaintext to uppercase and remove non-alphabetic characters
  plaintext = plaintext?.toUpperCase().replace(/[^A-Z]/g, "");

  // Check if the plaintext length is divisible by the key matrix size
  const keySize = keyMatrix.length;
  const paddingLength = keySize - (plaintext.length % keySize);
  if (paddingLength !== keySize) {
    // Add padding ('X') to make plaintext a multiple of keySize
    plaintext += "X".repeat(paddingLength);
  }

  // Initialize ciphertext string
  let ciphertext = "";

  // Loop through the plaintext in blocks of keySize
  for (let i = 0; i < plaintext.length; i += keySize) {
    // Extract a block of plaintext of size keySize
    const plaintextBlock = plaintext.slice(i, i + keySize);

    // Convert the plaintext block to a numeric vector
    const plaintextVector = [];
    for (let j = 0; j < keySize; j++) {
      plaintextVector.push(charToNumeric(plaintextBlock[j]));
    }

    // Perform matrix multiplication: Ciphertext = KeyMatrix * PlaintextVector (mod 26)
    const ciphertextVector = [];
    for (let j = 0; j < keySize; j++) {
      let sum = 0;
      for (let k = 0; k < keySize; k++) {
        sum += keyMatrix[j][k] * plaintextVector[k];
      }
      ciphertextVector.push(sum % 26); // Apply modulo 26
    }

    // Convert the numeric vector to ciphertext characters
    for (let j = 0; j < keySize; j++) {
      ciphertext += numericToChar(ciphertextVector[j]);
    }
  }

  return ciphertext;
};

// Function to decrypt ciphertext using the Hill Cipher
// Function to decrypt ciphertext using Hill Cipher algorithm
const decryptHillCipher = (ciphertext, keyMatrix) => {
  // Calculate the inverse matrix of the key matrix
  let inverseKeyMatrix;
  try {
    if (keyMatrix?.length === 2) {
      inverseKeyMatrix = matrixInverse2x2(keyMatrix);
    } else {
      inverseKeyMatrix = matrixInverse(keyMatrix);
    }

    // Convert the ciphertext into numeric vectors
    const ciphertextVectors = [];
    for (let i = 0; i < ciphertext.length; i += keyMatrix.length) {
      const vector = [];
      for (let j = 0; j < keyMatrix.length; j++) {
        vector.push(charToNumeric(ciphertext.charAt(i + j)));
      }
      ciphertextVectors.push(vector);
    }

    // Multiply the inverse key matrix by the ciphertext vectors
    const plaintextVectors = [];
    for (let i = 0; i < ciphertextVectors.length; i++) {
      const vector = [];
      for (let j = 0; j < keyMatrix.length; j++) {
        let sum = 0;
        for (let k = 0; k < keyMatrix.length; k++) {
          sum += inverseKeyMatrix[j][k] * ciphertextVectors[i][k];
        }
        vector.push(sum % 26);
      }
      plaintextVectors.push(vector);
    }
    // Alert.alert("here i am fourth");

    // Convert the resulting numeric vectors back into characters to obtain the plaintext
    let plaintext = "";
    for (let i = 0; i < plaintextVectors.length; i++) {
      for (let j = 0; j < keyMatrix.length; j++) {
        plaintext += numericToChar(plaintextVectors[i][j]);
      }
    }
    // Alert.alert("here i am fifth");

    return plaintext;
  } catch (error) {
    Alert.alert("Error is here", error.message);
    console.error("An error occurred:", error.message);
    return;
  }
};

export default function App() {
  const [plaintext, setPlaintext] = useState("");
  const [ciphertext, setCiphertext] = useState("");
  const [plaintext2, setPlaintext2] = useState("");
  const [ciphertext2, setCiphertext2] = useState("");
  const [keyText, setKeyText] = useState("");
  const [key, setKey] = useState([]);

  const handleEncrypt = () => {
    if (!plaintext || plaintext?.trim() === "") {
      Alert.alert("plaintext cannot be empty.");
      return null;
    }
    const numericKey = validateAndConvertKey(keyText);
    if (numericKey) {
      setKey(numericKey);
      const encryptedText = encryptHillCipher(plaintext, numericKey);
      if (encryptedText !== "") {
        setCiphertext(encryptedText);
        setCiphertext2(encryptedText);
      }
    }
  };

  const handleDecrypt = () => {
    if (!ciphertext || ciphertext?.trim() === "") {
      Alert.alert("ciphertext cannot be empty.");
      return null;
    }

    const numericKey = validateAndConvertKey(keyText);
    // Alert.alert("decrypted text is entered", numericKey.toString());
    if (!numericKey) {
      Alert.alert("Error", "Please enter a valid key.");
      return;
    }
    setKey(numericKey);

    if (!key || key?.length === 0) {
      // Alert.alert("Error", "Key matrix is not valid.");
      return <Text>loading</Text>;
    }

    if (ciphertext?.length % Math.sqrt(keyText.length) !== 0) {
      Alert.alert("enter the correct ciphertext");
      return null;
    }

    if (key?.length > 1 && ciphertext) {
      const decryptedText = decryptHillCipher(ciphertext, key);

      if (decryptedText !== "") {
        setPlaintext(decryptedText);
        setPlaintext2(decryptedText);
      } else {
        Alert.alert("Error", "Decryption failed.");
      }
    }

  };

  return (
    <ScrollView contentContainerStyle={styles.container2}>
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Hill Cipher Encryption and Decryption
        </Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Enter key"
        onChangeText={setKeyText}
        value={keyText}
      />
      <View style={styles.result}>
        <Text style={styles.text}>
          Key: {keyText?.toUpperCase()} = {"["}
          {key?.map((row) => `[${row.join(", ")}]`).join(", ")}
          {"]"}
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter plaintext"
        onChangeText={setPlaintext}
      />
      <View style={styles.button}>
        <Button title="Encrypt" onPress={handleEncrypt} />
      </View>
      <View style={styles.result}>
        <Text style={styles.text}>CipherText: {ciphertext2}</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Enter ciphertext"
        onChangeText={setCiphertext}
      />
      <View style={styles.button}>
        <Button title="Decrypt" onPress={handleDecrypt} />
      </View>
      <View style={styles.result}>
        <Text style={styles.text}>Plaintext: {plaintext2}</Text>
      </View>
    </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  container2: {
    

  },
  input: {
    height: 40,
    width: "90%",
    borderColor: "gray",
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
  text: {
    marginTop: 10,
    fontSize: 14,
  },
  button: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    marginTop: 10,
  },
  result: {
    border: 1,
    width: "90%",
    backgroundColor: "#e4eaff",
    marginTop: 10,
    // alignItems: 'center',
    justifyContent: "start",
    padding: 10,
  },
  header: {
    // backgroundColor: "blue", // You can choose your desired background color
    width: "100%",
    paddingVertical: 20,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2b334c",
    textAlign: "center",
  },
});
