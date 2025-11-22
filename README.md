<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<br />

<h3 align="center">ASCII-blobs</h3>

  <p align="center">
    High performant, highly customizable ASCII backgrounds 
    <br />
    <a href="https://daanhessen.github.io/ASCII-blobs/docs/"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://daanhessen.github.io/ASCII-blobs/">View Demo</a>
    &middot;
    <a href="https://github.com/DaanHessen/ASCII-blobs/issues/new?labels=bug&template=bug_report.md">Report Bug</a>
    &middot;
    <a href="https://github.com/DaanHessen/ASCII-blobs/issues/new?labels=enhancement&template=feature_request.md">Request Feature</a>
    <a href="https://www.npmjs.com/package/ascii-blobs">npm</a>
  </p>
</div>



<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
      </ul>
    </li>
     <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#usage-react">React</a></li>
        <li><a href="#usage-js">Vanilla JavaScript</a></li>
      </ul>
    </li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>



## About The Project

[![screenshot of portfolio using ASCII-blobs][product-screenshot]](https://daanhessen.nl)

Animated ASCII backgrounds using gaussian metaball rendering. It's fast, customizable, and framework-agnostic. I originally built this for my [portfolio](https://daanhessen.nl), but liked it enough to package it up for everyone else.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![TypeScript][TypeScript]][TypeScript-url]
* [![React][React.js]][React-url]
* [![Vite][Vite]][Vite-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Getting Started

### Prerequisites

Install via npm:

```sh
npm install ascii-blobs
```



## Usage

It works with both React and vanilla JavaScript.

### <a id="usage-react"></a> React

```tsx
import { useRef } from "react";
import { AsciiBlobs, getThemeClassName } from "ascii-blobs";
import type { AsciiBlobsRef } from "ascii-blobs";

export function Hero() {
  const blobsRef = useRef<AsciiBlobsRef | null>(null);

  return (
    <section style={{ position: "relative", minHeight: "420px" }}>
      <AsciiBlobs
        ref={blobsRef}
        className={getThemeClassName("dracula")}
        style={{ position: "absolute", inset: 0, zIndex: -1 }}
        colors={{ primary: "#BD93F9" }}
        blobBehavior={{ count: 10 }}
      />
    </section>
  );
}
```

### <a id="usage-js"></a> Vanilla JavaScript

```js
import { AsciiBlobs, getThemeClassName } from "ascii-blobs/vanilla";

const stage = document.querySelector("#stage");
const blobs = new AsciiBlobs(stage, {
  className: getThemeClassName("nord"),
  style: { position: "absolute", inset: "0" },
  colors: { primary: "#88C0D0" },
  blobBehavior: { count: 6, maxRadius: 180 },
  animation: { frameInterval: 42 },
});
```

_For full details, check the [Documentation](https://daanhessen.github.io/ASCII-blobs/docs/)_

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors:

<a href="https://github.com/DaanHessen/ASCII-blobs/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=DaanHessen/ASCII-blobs" alt="contrib.rocks image" />
</a>



## License

Distributed under the MIT license. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



## Contact

Daan Hessen - daanh2002@gmail.com

Project Link: [https://github.com/DaanHessen/ASCII-blobs](https://github.com/DaanHessen/ASCII-blobs)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



[contributors-shield]: https://img.shields.io/github/contributors/DaanHessen/ASCII-blobs.svg?style=for-the-badge
[contributors-url]: https://github.com/DaanHessen/ASCII-blobs/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/DaanHessen/ASCII-blobs.svg?style=for-the-badge
[forks-url]: https://github.com/DaanHessen/ASCII-blobs/network/members
[stars-shield]: https://img.shields.io/github/stars/DaanHessen/ASCII-blobs.svg?style=for-the-badge
[stars-url]: https://github.com/DaanHessen/ASCII-blobs/stargazers
[issues-shield]: https://img.shields.io/github/issues/DaanHessen/ASCII-blobs.svg?style=for-the-badge
[issues-url]: https://github.com/DaanHessen/ASCII-blobs/issues
[license-shield]: https://img.shields.io/github/license/DaanHessen/ASCII-blobs.svg?style=for-the-badge
[license-url]: https://github.com/DaanHessen/ASCII-blobs/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: docs/screenshot-2025-11-21_22-08-39.png
<!-- Shields.io badges. You can a comprehensive list with many more badges at: https://github.com/inttter/md-badges -->
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vite]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vitejs.dev/