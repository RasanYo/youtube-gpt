/**
 * YouTube URL type detector
 * Detects whether a YouTube URL is a video, channel, or playlist
 */

export interface YoutubeUrlInfo {
    type: 'video' | 'channel' | 'unknown';
    id: string | null;
  }
  
  export function detectYouTubeType(url: string): YoutubeUrlInfo {
    try {
      const urlObject = new URL(url);
      const hostname = urlObject.hostname;
      const pathname = urlObject.pathname;
      const searchParams = urlObject.searchParams;
  
      // Détection des URL de vidéo
      if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
        // Cas de l'URL watch?v=
        if (pathname === '/watch') {
          const videoId = searchParams.get('v');
          if (videoId) {
            return { type: 'video', id: videoId };
          }
        }
        // Cas de l'URL shorts/
        if (pathname.startsWith('/shorts/')) {
          const videoId = pathname.substring('/shorts/'.length);
           // Basic validation for shorts ID length (usually 11 characters)
          if (videoId && videoId.length >= 11) {
               // You might want more robust validation here
               return { type: 'video', id: videoId };
          }
        }
         // Cas de l'URL embed/ (souvent utilisé pour les intégrations)
         if (pathname.startsWith('/embed/')) {
             const videoId = pathname.substring('/embed/'.length);
              // Basic validation for embed ID length (usually 11 characters)
             if (videoId && videoId.length >= 11) {
                 // You might want more robust validation here
                 return { type: 'video', id: videoId };
             }
         }
      } else if (hostname === 'youtu.be') {
        // Cas de l'URL youtu.be/
        const videoId = pathname.substring(1); // Enlève le premier '/'
         // Basic validation for youtu.be ID length (usually 11 characters)
        if (videoId && videoId.length >= 11) {
             // You might want more robust validation here
             return { type: 'video', id: videoId };
        }
      }
  
      // Détection des URL de chaîne
      if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
        const pathnameParts = pathname.split('/').filter(part => part !== ''); // Divise et enlève les parties vides
  
        // Cas de l'URL /channel/
        if (pathnameParts[0] === 'channel' && pathnameParts.length > 1) {
          const channelId = pathnameParts[1];
          // Basic validation for channel ID (starts with UC)
          if (channelId && channelId.startsWith('UC')) {
               // You might want more robust validation here
               return { type: 'channel', id: channelId };
          }
        }
        // Cas de l'URL /user/ (legacy)
        if (pathnameParts[0] === 'user' && pathnameParts.length > 1) {
            const username = pathnameParts[1];
            // Pour les URL /user/ ou /@handle, on ne peut pas obtenir l'ID directement.
            // On retourne le type et le nom/handle pour une recherche ultérieure via l'API.
            return { type: 'channel', id: username }; // Ici, l'ID est en fait le nom d'utilisateur
        }
         // Cas de l'URL /@handle (plus récent)
         if (pathnameParts[0] && pathnameParts[0].startsWith('@') && pathnameParts.length > 0) {
             const handle = pathnameParts[0];
             // Pour les URL /user/ ou /@handle, on ne peut pas obtenir l'ID directement.
             // On retourne le type et le nom/handle pour une recherche ultérieure via l'API.
             return { type: 'channel', id: handle }; // Ici, l'ID est en fait le handle
         }
      }
  
      // Si aucun type connu n'est détecté
      return { type: 'unknown', id: null };
  
    } catch (error) {
      console.error("Erreur lors de l'analyse de l'URL :", error);
      return { type: 'unknown', id: null };
    }
  }
  