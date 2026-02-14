---
title: "Neural network based metal structure prediction after SLM"
description: "Not that interesting in practical sense but I did enjoy the process."
image: "/projects/slm/slm.png"
github: "https://github.com/Vsageev/SLM_simulation"
---

Decided to delve into physics-applied ML for my Bachelor's thesis.

The goal was to create a model that predicts structural properties (namely grain size distribution as f(x,y,z)) of a part produced using selective laser melting (SLM). Since traditional simulation methods could take days of computation on supercomputers even for relatively small regions, there is a need for a faster approach. ML-based solutions seemed promising. For my thesis I decided to narrow the scope and build a small POC.

After trying different model architectures, pre- and postprocessing approaches, this is what I landed on:

- A VAE was used to transform microstructure images into latent space and back.
- A "control network" predicted latent space encodings based on the coordinates of the melting location.
- Mean was subtracted from those encodings in postprocessing (the control network produced encodings that were very close to each other, so removing the mean improved output quality).

![SLM model flow](/projects/slm/flow.png)

The results captured the right trends: grains were larger in regions where traditional simulations also showed larger grains, while running up to 6 orders of magnitude faster than the cellular automata used for data generation (thanks to efficient convolution operations, GPU acceleration, and larger time steps of up to 50×).

Results visualisation is shown in the project preview image.
