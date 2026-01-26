import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface AnimatedSplashProps {
  onFinish: () => void;
}

export default function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const videoSource = require('../assets/splash-animation.mp4');
  
  const player = useVideoPlayer(videoSource, player => {
    player.loop = false;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    const subscription = player.addListener('statusChange', (status) => {
      if (status.status === 'idle' && status.oldStatus === 'readyToPlay') {
        onFinish();
      }
    });

    const timer = setTimeout(() => {
      onFinish();
    }, 6000);

    return () => {
      subscription.remove();
      clearTimeout(timer);
    };
  }, [player, onFinish]);

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={false}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b82f6',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});