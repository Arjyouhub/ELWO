import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLibrary } from '../../store/LibraryContext';

export const AddToPlaylistModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    isAddToPlaylistOpen,
    selectedTrackForPlaylist,
    closeAddToPlaylist,
    playlists,
    isLiked,
    toggleLike,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    isTrackInPlaylist,
    createPlaylist,
  } = useLibrary();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  if (!selectedTrackForPlaylist) return null;

  const track = selectedTrackForPlaylist;
  const liked = isLiked(track.id);
  const bottomInset = Math.max(insets.bottom, 16);

  const handleTogglePlaylist = (playlistId: string) => {
    if (playlistId === 'pl-liked') {
      toggleLike(track);
      return;
    }

    const inPlaylist = isTrackInPlaylist(playlistId, track.id);
    if (inPlaylist) {
      removeTrackFromPlaylist(playlistId, track.id);
    } else {
      addTrackToPlaylist(playlistId, track);
    }
  };

  const handleCreateAndAdd = () => {
    if (!newTitle.trim()) return;
    const created = createPlaylist(newTitle.trim(), 'Created by You');
    addTrackToPlaylist(created.id, track);
    setNewTitle('');
    setIsCreatingNew(false);
  };

  return (
    <Modal
      visible={isAddToPlaylistOpen}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={closeAddToPlaylist}>
      <View style={styles.backdrop}>
        {/* Dismiss modal when tapping outside */}
        <Pressable style={styles.backdropDismiss} onPress={closeAddToPlaylist} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}>
          <View style={[styles.sheetContainer, { paddingBottom: bottomInset + 8 }]}>
            {/* Top Drag Handle Indicator */}
            <View style={styles.handleContainer}>
              <View style={styles.handleBar} />
            </View>

            {/* Header Row */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>Add to Playlist</Text>
                <Text style={styles.headerSubtitle}>Tap to save into your collections</Text>
              </View>
              <Pressable
                onPress={closeAddToPlaylist}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.closeBtn,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                ]}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </Pressable>
            </View>

            {/* Track Info Card */}
            <View style={styles.trackCard}>
              <Image source={{ uri: track.artworkUrl }} style={styles.trackArtwork} />
              <View style={styles.trackMeta}>
                <Text numberOfLines={1} style={styles.trackTitle}>
                  {track.title}
                </Text>
                <Text numberOfLines={1} style={styles.trackArtist}>
                  {track.artistName}
                </Text>
                <View style={styles.trackBadgeRow}>
                  <View style={styles.trackPill}>
                    <Ionicons name="sparkles" size={10} color="#A78BFA" />
                    <Text style={styles.trackPillText}>Lossless Master</Text>
                  </View>
                </View>
              </View>
              <Pressable
                hitSlop={10}
                onPress={() => toggleLike(track)}
                style={({ pressed }) => [
                  styles.heartBtn,
                  liked && styles.heartBtnActive,
                  pressed && { transform: [{ scale: 0.9 }] },
                ]}>
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={22}
                  color={liked ? '#EF4444' : '#94A3B8'}
                />
              </Pressable>
            </View>

            {/* Inline Playlist Creation */}
            {!isCreatingNew ? (
              <Pressable
                style={({ pressed }) => [
                  styles.createTriggerRow,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => setIsCreatingNew(true)}>
                <LinearGradient
                  colors={['#8B5CF6', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createIconCircle}>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.createTextGroup}>
                  <Text style={styles.createTriggerText}>Create New Playlist</Text>
                  <Text style={styles.createTriggerSub}>Make a fresh custom mix</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </Pressable>
            ) : (
              <View style={styles.inlineCreateBox}>
                <TextInput
                  style={styles.inlineInput}
                  placeholder="Enter playlist name..."
                  placeholderTextColor="#64748B"
                  value={newTitle}
                  onChangeText={setNewTitle}
                  autoFocus
                />
                <View style={styles.inlineActions}>
                  <Pressable
                    onPress={() => {
                      setIsCreatingNew(false);
                      setNewTitle('');
                    }}
                    style={styles.inlineCancelBtn}>
                    <Text style={styles.inlineCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreateAndAdd}
                    disabled={!newTitle.trim()}
                    style={[
                      styles.inlineSaveBtn,
                      !newTitle.trim() && styles.inlineSaveBtnDisabled,
                    ]}>
                    <LinearGradient
                      colors={
                        newTitle.trim()
                          ? ['#8B5CF6', '#6366F1']
                          : ['#334155', '#1E293B']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.inlineSaveGradient}>
                      <Text style={styles.inlineSaveText}>Save & Add</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Section Header */}
            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionHeading}>Choose Playlist</Text>
              <Text style={styles.playlistCountBadge}>{playlists.length} playlists</Text>
            </View>

            {/* Playlists List */}
            <ScrollView
              style={styles.playlistsList}
              contentContainerStyle={styles.playlistsContent}
              showsVerticalScrollIndicator={false}>
              {playlists.map((playlist) => {
                const inPlaylist =
                  playlist.id === 'pl-liked'
                    ? liked
                    : isTrackInPlaylist(playlist.id, track.id);

                const isLikedPlaylist = playlist.id === 'pl-liked';

                return (
                  <Pressable
                    key={playlist.id}
                    style={({ pressed }) => [
                      styles.playlistItem,
                      inPlaylist && styles.playlistItemActive,
                      pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
                    ]}
                    onPress={() => handleTogglePlaylist(playlist.id)}>
                    <View
                      style={[
                        styles.playlistIconBox,
                        isLikedPlaylist && styles.likedIconBox,
                        inPlaylist && !isLikedPlaylist && styles.activeIconBox,
                      ]}>
                      <Ionicons
                        name={isLikedPlaylist ? 'heart' : 'musical-notes'}
                        size={18}
                        color={
                          isLikedPlaylist
                            ? '#EF4444'
                            : inPlaylist
                            ? '#A78BFA'
                            : '#94A3B8'
                        }
                      />
                    </View>
                    <View style={styles.playlistMeta}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.playlistTitle,
                          inPlaylist && styles.playlistTitleActive,
                        ]}>
                        {playlist.title}
                      </Text>
                      <Text style={styles.playlistCount}>
                        {isLikedPlaylist
                          ? `${playlist.tracks.length} liked tracks`
                          : `${playlist.tracks.length} songs`}
                      </Text>
                    </View>

                    {/* Animated Check / Add Indicator */}
                    <View
                      style={[
                        styles.checkCircle,
                        inPlaylist && styles.checkCircleActive,
                      ]}>
                      {inPlaylist ? (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      ) : (
                        <Ionicons name="add" size={14} color="#475569" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Bottom Done Button */}
            <Pressable
              style={({ pressed }) => [
                styles.doneBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
              onPress={closeAddToPlaylist}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.doneBtnGradient}>
                <Text style={styles.doneBtnText}>Done</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  keyboardContainer: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#070A14',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '85%',
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleBar: {
    width: 44,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    marginTop: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30, 27, 75, 0.35)',
    borderRadius: 16,
    padding: 10,
    marginTop: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.18)',
  },
  trackArtwork: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  trackMeta: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackArtist: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  trackBadgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  trackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trackPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C4B5FD',
  },
  heartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  createTriggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  createIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTextGroup: {
    flex: 1,
  },
  createTriggerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  createTriggerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  inlineCreateBox: {
    backgroundColor: 'rgba(20, 24, 45, 0.95)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  inlineInput: {
    height: 44,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  inlineActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  inlineCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  inlineCancelText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  inlineSaveBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  inlineSaveBtnDisabled: {
    opacity: 0.5,
  },
  inlineSaveGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  inlineSaveText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  playlistCountBadge: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  playlistsList: {
    maxHeight: 280,
  },
  playlistsContent: {
    gap: 8,
    paddingBottom: 14,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1.2,
    borderColor: 'transparent',
  },
  playlistItemActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  playlistIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedIconBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  activeIconBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
  },
  playlistMeta: {
    flex: 1,
  },
  playlistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playlistTitleActive: {
    color: '#FFFFFF',
  },
  playlistCount: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkCircleActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  doneBtn: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 6,
  },
  doneBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
