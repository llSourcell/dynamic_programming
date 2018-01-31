# AlignmentVisualizer

Working demo at: https://valiec.github.io/AlignmentVisualizer

Alignment Visualizer is a web app which will show you the dynamic programming matrix for an alignment of two DNA sequences. I developed it in the summer of 2016 as a teaching tool to help people understand how dynamic programming works in DNA sequence alignments.

It supports four different alignment algorithms: Global Alignment, Local Alignment, Fitting Alignment, and Overlap Alignment. All alignments are implemented with linear gap penalties. You can enter two sequences and modify the scoring matrix, and Alignment Visualizer will show you the dynamic programming matrix for the alignment. You are also able to see all the possible scores for a cell (one for each direction) as well as the one chosen (i.e. the maximum).

Though it is intended as a teaching tool, it can also be useful to programmers debugging alignment algorithms, since it allows you to see both the aligned sequences and the dynamic programming matrix (including traceback directions) for an alignment.

If you're a programmer who wants to make a custom version of Alignment Visualizer to test an unusual alignment, you can. However, if you distribute your custom version, please provide a link back to the original version. I don't want a ton of versions of Alignment Visualizer, all slightly different, on the internet and users not knowing which is the original.
