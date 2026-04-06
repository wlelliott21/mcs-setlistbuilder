import type { Song, Gig, Tag } from '@/types';

const s = (
  id: string, title: string, artist: string, key: string, dur: number, tags: Tag[],
  extra?: Partial<Song>
): Song => ({
  id, title, artist, defaultKey: key, defaultDuration: dur, tags,
  versions: [], audioLink: '', chartLink: '', notes: '',
  createdAt: '2025-01-15T00:00:00Z', ...extra,
});

export const MOCK_SONGS: Song[] = [
  s('s01', 'At Last', 'Etta James', 'Bb', 182, ['Slow', 'First Dance', 'Dinner'], {
    audioLink: 'https://open.spotify.com/track/3vkCueOmm7xQDoB5Hx4fz4',
    chartLink: 'https://www.dropbox.com/s/abc123/at-last-chart.pdf',
    notes: 'Great opener for dinner sets',
    versions: [
      { id: 'v01a', name: 'Full Version' },
      { id: 'v01b', name: 'First Dance Version', duration: 105, notes: 'Shortened — skip intro, straight to verse 2 chorus', key: 'Bb' },
    ],
  }),
  s('s02', 'Uptown Funk', 'Bruno Mars', 'Dm', 270, ['High Energy', 'Dance Floor'], {
    audioLink: 'https://open.spotify.com/track/32OlwWuMpZ6b0aN2RZOeMS',
    notes: 'Horn hits on the 1. Big crowd pleaser.',
  }),
  s('s03', "Don't Stop Believin'", 'Journey', 'E', 250, ['High Energy', 'Encore'], {
    audioLink: 'https://www.youtube.com/watch?v=1k8craCGpgs',
  }),
  s('s04', 'Fly Me to the Moon', 'Frank Sinatra', 'C', 204, ['Dinner', 'Slow'], {
    audioLink: 'https://open.spotify.com/track/6xGruZOHkvEFTBRnkfRIgp',
    chartLink: 'https://www.dropbox.com/s/def456/fly-me-chart.pdf',
  }),
  s('s05', 'Signed Sealed Delivered', 'Stevie Wonder', 'F', 193, ['Dance Floor', 'High Energy']),
  s('s06', 'I Wanna Dance with Somebody', 'Whitney Houston', 'G', 292, ['Dance Floor', 'High Energy']),
  s('s07', "Can't Help Falling in Love", 'Elvis Presley', 'C', 180, ['First Dance', 'Slow'], {
    audioLink: 'https://open.spotify.com/track/44AyOl4qVkzS48vBsbNXaC',
    versions: [
      { id: 'v07a', name: 'Full Version' },
      { id: 'v07b', name: 'Ceremony Version', duration: 135, notes: 'Acoustic, stripped back for ceremony' },
    ],
  }),
  s('s08', 'September', 'Earth, Wind & Fire', 'Ab', 215, ['Dance Floor', 'High Energy', 'Encore']),
  s('s09', 'All of Me', 'John Legend', 'Ab', 270, ['First Dance', 'Slow', 'Dinner'], {
    versions: [
      { id: 'v09a', name: 'Full Version' },
      { id: 'v09b', name: 'Shortened', duration: 180, notes: 'Skip bridge, straight to final chorus' },
    ],
  }),
  s('s10', 'Superstition', 'Stevie Wonder', 'Ebm', 266, ['Dance Floor', 'High Energy'], {
    notes: 'Clavinet intro — keys player leads',
  }),
  s('s11', 'Thinking Out Loud', 'Ed Sheeran', 'D', 281, ['First Dance', 'Slow']),
  s('s12', 'Shut Up and Dance', 'Walk the Moon', 'Bb', 199, ['Dance Floor', 'High Energy']),
  s('s13', 'Come Away with Me', 'Norah Jones', 'C', 198, ['Dinner', 'Slow'], {
    chartLink: 'https://www.dropbox.com/s/ghi789/come-away-chart.pdf',
  }),
  s('s14', 'Mr. Brightside', 'The Killers', 'Bb', 222, ['High Energy', 'Encore']),
  s('s15', 'Just the Way You Are', 'Bruno Mars', 'F', 220, ['Slow', 'Dinner']),
  s('s16', 'Crazy in Love', 'Beyoncé', 'Dm', 236, ['Dance Floor', 'High Energy']),
  s('s17', 'The Way You Look Tonight', 'Frank Sinatra', 'Eb', 203, ['Dinner', 'First Dance', 'Slow']),
  s('s18', 'Sweet Caroline', 'Neil Diamond', 'B', 201, ['Encore', 'High Energy'], {
    notes: 'Crowd singalong — wait for the "BAH BAH BAH"',
  }),
  s('s19', 'A Thousand Years', 'Christina Perri', 'Bb', 286, ['First Dance', 'Slow']),
  s('s20', 'Billie Jean', 'Michael Jackson', 'F#m', 294, ['Dance Floor', 'High Energy']),
  s('s21', 'Here Comes the Sun', 'The Beatles', 'A', 186, ['Dinner']),
  s('s22', "Isn't She Lovely", 'Stevie Wonder', 'Db', 394, ['First Dance', 'Dinner'], {
    versions: [
      { id: 'v22a', name: 'Full Jam', duration: 394 },
      { id: 'v22b', name: 'Radio Edit', duration: 195, notes: 'Standard radio arrangement' },
    ],
  }),
  s('s23', "Livin' on a Prayer", 'Bon Jovi', 'Cm', 249, ['Encore', 'High Energy']),
  s('s24', 'L-O-V-E', 'Nat King Cole', 'G', 152, ['Dinner', 'Slow']),
  s('s25', 'Dancing Queen', 'ABBA', 'A', 232, ['Dance Floor', 'High Energy']),
];

export const MOCK_GIGS: Gig[] = [
  {
    id: 'g01', name: 'Johnson Wedding', date: '2025-08-15',
    venue: 'The Grand Ballroom', client: 'Sarah & Michael Johnson',
    notes: 'Band call: 4pm. First dance after dinner service. Bride requests no "Chicken Dance".',
    template: 'wedding', bufferTime: 15, isLocked: false, createdAt: '2025-06-01T00:00:00Z',
    sets: [
      { id: 'sg1s1', name: 'Cocktail Hour', targetDuration: 60, collapsed: false, entries: [
        { id: 'e001', songId: 's04' }, { id: 'e002', songId: 's13' },
        { id: 'e003', songId: 's24' }, { id: 'e004', songId: 's17' },
        { id: 'e005', songId: 's21' }, { id: 'e006', songId: 's15' },
      ]},
      { id: 'sg1s2', name: 'Dinner Set', targetDuration: 45, collapsed: false, entries: [
        { id: 'e007', songId: 's09', versionId: 'v09b' }, { id: 'e008', songId: 's22', versionId: 'v22b' },
        { id: 'e009', songId: 's01' }, { id: 'e010', songId: 's19' },
        { id: 'e011', songId: 's11' },
      ]},
      { id: 'sg1s3', name: 'First Dances', targetDuration: 15, collapsed: false, entries: [
        { id: 'e012', songId: 's07', versionId: 'v07b' },
        { id: 'e013', songId: 's01', versionId: 'v01b', keyOverride: 'C' },
      ]},
      { id: 'sg1s4', name: 'Dance Set 1', targetDuration: 45, collapsed: false, entries: [
        { id: 'e014', songId: 's05' }, { id: 'e015', songId: 's02' },
        { id: 'e016', songId: 's08' }, { id: 'e017', songId: 's06' },
        { id: 'e018', songId: 's16' }, { id: 'e019', songId: 's25' },
        { id: 'e020', songId: 's20' },
      ]},
      { id: 'sg1s5', name: 'Dance Set 2', targetDuration: 45, collapsed: false, entries: [
        { id: 'e021', songId: 's12' }, { id: 'e022', songId: 's10' },
        { id: 'e023', songId: 's14' }, { id: 'e024', songId: 's18' },
        { id: 'e025', songId: 's23' }, { id: 'e026', songId: 's03' },
      ]},
    ],
  },
  {
    id: 'g02', name: 'TechCorp Annual Gala', date: '2025-09-22',
    venue: 'The Skyline Hotel', client: 'TechCorp Inc.',
    notes: 'Corporate event. Keep it classy during dinner, party after 9pm.',
    template: 'corporate', bufferTime: 15, isLocked: true, createdAt: '2025-07-10T00:00:00Z',
    sets: [
      { id: 'sg2s1', name: 'Background / Arrival', targetDuration: 45, collapsed: false, entries: [
        { id: 'e027', songId: 's04' }, { id: 'e028', songId: 's13' },
        { id: 'e029', songId: 's17' }, { id: 'e030', songId: 's21' },
        { id: 'e031', songId: 's24' }, { id: 'e032', songId: 's15' },
      ]},
      { id: 'sg2s2', name: 'Dinner Set', targetDuration: 60, collapsed: false, entries: [
        { id: 'e033', songId: 's09' }, { id: 'e034', songId: 's01' },
        { id: 'e035', songId: 's11' }, { id: 'e036', songId: 's19' },
        { id: 'e037', songId: 's22', versionId: 'v22b' }, { id: 'e038', songId: 's07' },
      ]},
      { id: 'sg2s3', name: 'Party Set 1', targetDuration: 45, collapsed: false, entries: [
        { id: 'e039', songId: 's02' }, { id: 'e040', songId: 's08' },
        { id: 'e041', songId: 's25' }, { id: 'e042', songId: 's06' },
        { id: 'e043', songId: 's05' }, { id: 'e044', songId: 's20' },
        { id: 'e045', songId: 's16' },
      ]},
      { id: 'sg2s4', name: 'Party Set 2', targetDuration: 45, collapsed: false, entries: [
        { id: 'e046', songId: 's10' }, { id: 'e047', songId: 's12' },
        { id: 'e048', songId: 's14' }, { id: 'e049', songId: 's18' },
        { id: 'e050', songId: 's23' }, { id: 'e051', songId: 's03' },
      ]},
    ],
  },
];
