function imgCheck() {
  console.log('함수 실행 됨~~');
  const ifImg = document.getElementById('ifImg');
  const imgType = document.getElementById('img_type').checked;
  const imgURLInput = document.getElementById('img_url');

  ifImg.style.display = imgType ? 'block' : 'none';

  // 이미지형으로 전환할 때 이미지 URL을 복원
  if (imgType) {
    imgURLInput.value = imageUrl;
  } else {
    // 텍스트형으로 전환할 때 이미지 URL 초기화
    imgURLInput.value = '';
    // imageUrl = '';
  }
}

function saveImageUrl() {
  imageUrl = document.getElementById('img_url').value;
}

// function imgCheck() {
//   console.log('함수 실행 됨~~');
//   const ifImg = document.getElementById('ifImg');
//   const imgType = document.getElementById('img_type').checked;

//   ifImg.style.display = imgType ? 'block' : 'none';
// }
