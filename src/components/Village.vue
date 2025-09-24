<template>
  <div class="village-map">
    <img src="@/assets/sat.jpg" alt="Village" class="village-img" />
    <!-- Example: Guild house link -->
    <router-link
      to="/guild"
      class="house-link guild-house"
      title="Go to Guild"
    ></router-link>
    <router-link
      to="/blacksmith"
      class="house-link blacksmith-house"
      title="Go to Blacksmith">
    </router-link>
    <!-- Add more router-links for other houses as needed -->
  </div>
</template>

<style scoped>
.village-map {
  position: relative;
  width: 950px;   /* Set to your image's width */
  height: 645px;  /* Set to your image's height */
}
.village-img {
  width: 100%;
  height: 100%;
  display: block;
}
.house-link {
  position: absolute;
  display: block;
  /* Transparent clickable area */
  background: rgba(255,255,255,0); 
  cursor: pointer;
}
/* Example: Position for the guild house (adjust these values!) */
.guild-house {
  left: 670px;   /* X position */
  top: 260px;    /* Y position */
  width: 180px;  /* clickable area width */
  height: 220px; /* clickable area height */
  /* Optional: add a border for debugging */
  /* border: 2px solid red; */
}

.blacksmith-house {
  left: 500px;   /* X position */
  top: 70px;    /* Y position */
  width: 180px;  /* clickable area width */
  height: 220px; /* clickable area height */
}
</style>