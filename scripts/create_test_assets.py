from pathlib import Path
base = Path('test-assets')
base.mkdir(exist_ok=True)
(base / 'sample_certificate.pdf').write_text('Dummy certificate content with CERT-1234', encoding='utf-8')
(base / 'sample_resume.docx').write_text('Resume placeholder content', encoding='utf-8')
(base / 'sample_photo.png').write_text('PNG placeholder', encoding='utf-8')
print('created files in', base.resolve())
