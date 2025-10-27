import { Supadata } from '@supadata/js';

async function testTranscript() {
  try {
    console.log('Testing youtube-transcript library...');
    console.log('Fetching transcript...\n');
    
    const supadata = new Supadata({
      apiKey: "sd_b86be59870f1957cfcb4ef963ff46b3a",
    });
    
    const transcript = await supadata.youtube.transcript({
      videoId: "_uvuPcJCcKk",
    });
    console.log(transcript);
    console.log('Transcript fetched successfully!');
    console.log('Number of transcript segments:', transcript.length);
    
    if (transcript.length === 0) {
      console.log('No transcript available for this video.');
      return;
    }
    
    console.log('\nFirst 5 segments:');
    console.log(JSON.stringify(transcript.slice(0, 5), null, 2));
    
    console.log('\nLast 5 segments:');
    console.log(JSON.stringify(transcript.slice(-5), null, 2));
    
    console.log('\nFull transcript structure:');
    console.log('Keys in first segment:', Object.keys(transcript[0]));
    
    // Show a sample of the actual text content
    const sampleText = transcript.slice(0, 10).map(segment => segment.text).join(' ');
    console.log('\nSample text content (first 10 segments):');
    console.log(sampleText);
    
  } catch (error) {
    console.error('Error fetching transcript:', error);
    console.error('Error details:', error.message);
  }
}

testTranscript();
