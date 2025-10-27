#!/usr/bin/env node

/**
 * Test script to fetch transcript using youtube-transcript library
 * Usage: node test-timedtext.js <VIDEO_ID>
 * Example: node test-timedtext.js ArJoVGAv_PQ
 */

import { YoutubeTranscript } from '@danielxceron/youtube-transcript';

async function fetchTranscript(videoId) {
  console.log(`Fetching transcript for video: ${videoId}\n`);
  
  try {
    const transcript = await YoutubeTranscript.fetchTranscript("https://www.youtube.com/watch?v=ZuNR-3Ke_6U");
    console.log(transcript);
    console.log('✓ Transcript fetched successfully!');
    console.log(`✓ Number of transcript entries: ${transcript.length}\n`);
    
    if (transcript.length === 0) {
      console.log('No transcript available for this video.');
      return null;
    }
    
    console.log('First 5 transcript segments:');
    console.log('─'.repeat(80));
    console.log(JSON.stringify(transcript.slice(0, 5), null, 2));
    console.log('─'.repeat(80));
    
    console.log('\nLast 5 transcript segments:');
    console.log('─'.repeat(80));
    console.log(JSON.stringify(transcript.slice(-5), null, 2));
    console.log('─'.repeat(80));
    
    // Show structure of transcript items
    console.log('\nTranscript item structure:');
    if (transcript.length > 0) {
      console.log('Keys in transcript item:', Object.keys(transcript[0]));
      console.log('Sample item:', transcript[0]);
    }
    
    // Show cumulative text
    const sampleText = transcript.slice(0, 10).map(item => item.text).join(' ');
    console.log('\nSample text (first 10 segments):');
    console.log('─'.repeat(80));
    console.log(sampleText);
    console.log('─'.repeat(80));
    
    // Total duration
    if (transcript.length > 0) {
      const totalDuration = transcript[transcript.length - 1].offset + transcript[transcript.length - 1].duration;
      console.log(`\nTotal video duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
    }
    
    return transcript;
    
  } catch (error) {
    console.error('Error fetching transcript:', error.message);
    console.error('Full error:', error);
    return null;
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node test-timedtext.js <VIDEO_ID>');
  console.error('Example: node test-timedtext.js ArJoVGAv_PQ');
  process.exit(1);
}

const videoId = args[0];

fetchTranscript(videoId)
  .then((transcript) => {
    if (transcript) {
      console.log('\nTo save the full transcript to a file:');
      console.log(`  node test-timedtext.js ${videoId} > transcript.json`);
    } else {
      console.log('\n✗ Failed to fetch transcript');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n✗ Unexpected error:', error);
    process.exit(1);
  });

