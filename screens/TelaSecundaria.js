import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { StyleSheet, View, Text, ScrollView, Image, Dimensions, Modal, Share } from 'react-native';
import { IconButton, Provider, Snackbar, Button, TextInput } from 'react-native-paper';
import { launchImageLibraryAsync, MediaTypeOptions } from 'expo-image-picker';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const fetcher = (url) => fetch(url).then((response) => response.json());

const convertImageToBase64 = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

const Feed = () => {
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showErrorSnackbar, setshowErrorSnackbar] = useState(false);
  const [showDeleteSnackbar, setshowDeleteSnackbar] = useState(false);
  const [showSuccesSnackbar, setshowSuccesSnackbar] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { data: posts, error: postsError, mutate } = useSWR(
    'https://api-mobile.herokuapp.com/users/1/posts',
    fetcher
  );

  if (postsError) {
    return <Text>Erro ao carregar posts</Text>;
  }

  if (!posts) {
    return <Text>Carregando posts...</Text>;
  }

  const convertBase64ToImage = (base64String) => {
    return `data:image/jpeg;base64,${base64String}`;
  };

  const handleDeletePost = (postId) => {
    const postToDelete = posts.find((post) => post.id === postId);
    setSelectedPost(postToDelete);
  };

  const confirmDeletePost = async () => {
    try {
      const response = await fetch(`https://api-mobile.herokuapp.com/users/1/posts/${selectedPost.id}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        await deleteComments(selectedPost.id); // Excluir os comentários relacionados ao post
        await loadComments(selectedPost.id); // Carregar os comentários atualizados
        mutate();
        setshowDeleteSnackbar(true);
      } else {
        console.log(`Failed to delete post with ID: ${selectedPost.id}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setSelectedPost(null);
      setSelectedPostId(null);
    }
  };
    
  
  const handleUploadImage = async () => {
    const permissionResult = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
  
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }
  
    if (!permissionResult.canceled && permissionResult.assets.length > 0) {
      const selectedAsset = permissionResult.assets[0];
  
      try {
        setLoading(true);
  
        const base64Image = await convertImageToBase64(selectedAsset.uri);
  
        const response = await fetch('https://api-mobile.herokuapp.com/users/1/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: subtitle,
            content: base64Image,
          }),
        });
  
        if (response.ok) {
          setShowConfirmModal(false);
          setSelectedImage(selectedAsset);
          setSelectedImage(null);
          setSubtitle('');
          mutate();
          setshowSuccesSnackbar(true);
        } else {
          console.log('Failed to create post');
          setshowErrorSnackbar(true);
        }
      } catch (error) {
        console.error('Error creating post:', error);
        setError(error.message);
        setshowErrorSnackbar(true);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handlePostComment = (postId) => {
    postComment(postId, commentText);
  };
  
  
  const postComment = async (postId, commentText) => {
    if (!commentText) {
      console.log('O texto do comentário está vazio');
      return;
    }
    try {
      const response = await fetch(`https://api-mobile.herokuapp.com/users/1/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: commentText,
        }),
      });
  
      if (response.ok) {
        console.log('Comment created successfully');
        setCommentText('');
  
        // Carregar os comentários atualizados
        loadComments(postId);
      } else {
        console.log('Failed to create comment');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };
  
  const loadComments = async (postId) => {
    try {
      const response = await fetch(`https://api-mobile.herokuapp.com/users/1/posts/${postId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      } else {
        console.log(`Failed to load comments for postId: ${postId}`);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const deleteComments = async (postId) => {
    try {
      const response = await fetch(`https://api-mobile.herokuapp.com/users//posts/comments`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        console.log(`Comments deleted successfully for postId: ${postId}`);
      } else {
        console.log(`Failed to delete comments for postId: ${postId}`);
      }
    } catch (error) {
      console.error('Error deleting comments:', error);
    }
  };

  const handleSharePost = async (post) => {
    try {
      const shareOptions = {
        message: `Confira essa postagem: ${post.title}`,
        url: convertBase64ToImage(post.content),
      };
      const result = await Share.share(shareOptions);
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Compartilhado com sucesso
        } else {
          // Compartilhado com sucesso
        }
      } else if (result.action === Share.dismissedAction) {
        // Compartilhamento cancelado
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  return (
    <Provider>
      <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <IconButton
          icon="upload"
          backgroundColor= "#6750a4"
          iconColor= "#FFF"
          size={25}
          onPress={handleUploadImage}
          style={styles.uploadButton}
          >Fazer upload
        </IconButton>
      </View>
        {posts.map((post) => (
          <View key={post.id} style={styles.postContainer}>
            <View style={styles.postHeader}>
              <Image source={require('../assets/avatar.jpg')} style={styles.avatar} />
              <Text style={styles.username}>{post.username}Pierre Aronnax</Text>
            </View>
            <View style={styles.postInfo}>
            {post.content && (
  <Image
    source={{ uri: convertBase64ToImage(post.content) }}
    style={styles.contentImage}
  />
)}
<IconButton
  icon="delete"
  size={25}
  onPress={() => handleDeletePost(post.id)}
  style={styles.deleteButton}
/>
    <View style={styles.likes}>
    <IconButton
  icon="heart"
  size={25}
  style={styles.iconButton}
  onPress={() => {
    // Ação quando o botão de coração for pressionado
    setLikes((prevLikes) => {
      return { ...prevLikes, [post.id]: (prevLikes[post.id] || 0) + 1 };
    });
  }}  
/>
  <IconButton
    icon="comment"
    size={25}
    style={styles.iconButton}
    onPress={() => {
      setSelectedPostId(post.id); // Define o postId ao pressionar o botão de comentário
      setShowConfirmModal(true);
    }}
  />
  <IconButton
              icon="send"
              size={25}
              style={styles.iconButton}
              onPress={() => handleSharePost(post)}
            />
</View>

<View style={styles.textContainer}>
  <Text style={styles.username}>{post.username} Pierre Aronnax</Text>
  <Text style={styles.subtitle}>{post.title}</Text>
</View>

<Text style={styles.buttons}>
  {likes[post.id] ? `${likes[post.id]} curtidas` : '0 curtidas'}
</Text>

<Text style={styles.username}>Comentários</Text>
{comments.map((comment) => (
  <Text style={styles.subtitle} key={comment.id}>{comment.text}</Text>
))}
            </View>
          </View>
        ))}
      </ScrollView>
      <Modal
        visible={selectedPost !== null}
        onRequestClose={() => setSelectedPost(null)}
        transparent
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Excluir post</Text>
            <Text style={styles.modalMessage}>Tem certeza que quer excluir seu post?</Text>
            <View style={styles.modalButtonsContainer}>
            <Button
  mode="contained"
  onPress={() => {
    confirmDeletePost();
    deleteComments();
  }}
  style={styles.modalButton}
>
  Confirmar
</Button>
              <Button
                mode="outlined"
                onPress={() => setSelectedPost(null)}
                style={styles.modalButton}
              >
                Não
              </Button>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
  visible={showConfirmModal}
  onRequestClose={() => setShowConfirmModal(false)}
  transparent
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Adicionar comentário</Text>
      <TextInput
        label="Adicionar legenda"
        value={commentText}
        onChangeText={setCommentText}
        style={styles.subtitleInput}
      />
      <View style={styles.modalButtonContainer}>
        <Button
          mode="contained"
          onPress={() => {
            handlePostComment(selectedPostId);
            setShowConfirmModal(false);
          }}
          style={styles.modalButton}
          contentStyle={styles.modalButtonContent}
        >
          Confirmar
        </Button>
        <Button
          mode="outlined"
          onPress={() => setShowConfirmModal(false)}
          style={styles.modalButton}
          contentStyle={styles.modalButtonContent}
        >
          Cancelar
        </Button>
      </View>
    </View>
  </View>
</Modal>
      <Snackbar
      visible={showSuccesSnackbar}
      onDismiss={() => setshowSuccesSnackbar(false)}
      duration={3000}
      theme={{ colors: { surface: '#6750a4' } }}
    >
      {'Postagem criada com sucesso'}
    </Snackbar>
    <Snackbar
      visible={showDeleteSnackbar}
      onDismiss={() => setshowDeleteSnackbar(false)}
      duration={3000}
      theme={{ colors: { surface: '#6750a4' } }}
    >
      {'Postagem excluída com sucesso'}
    </Snackbar>
      <Snackbar
        visible={showErrorSnackbar}
        onDismiss={() => setshowErrorSnackbar(false)}
        duration={3000}
        theme={{ colors: { surface: '#6750a4' }}}
      >
        {'Erro ao criar postagem'}
      </Snackbar>
    </Provider>
    
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'flex-end',
    padding: 10,
  },
  uploadButton: {
    backgroundColor: '#6750a4'
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  postContainer: {
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  username: {
    fontWeight: 'bold',
    marginRight: 5,
    paddingLeft: 10,
  },
  subtitle: {
    fontWeight: 'light',
    paddingLeft: 12,
  },
  postInfo: {
    alignItems: 'flex-start',
  },
  contentImage: {
    width: windowWidth,
    height: windowWidth,
    marginBottom: 10,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 12,
    marginBottom: 10,
  },
  iconButton: {
    marginLeft: -10,
    marginBottom: -10,
  },
  likes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 12,
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  modalMessage: {
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
  },
  modalButton: {
    marginHorizontal: 10,
  },
  subtitleInput: {
    marginBottom: 10,
    width: 300,
  },
  selectedImage: {
    width: windowWidth - 40,
    height: windowHeight * 0.3,
    marginBottom: 10,
  },
  uploadImageButton: {
    marginBottom: 10,
  },
  Snackbar: {
    backgroundColor: '#6750a4',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButtonContent: {
    height: 40,
  },  
});

export default Feed;