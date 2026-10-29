{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = {
    self,
    nixpkgs,
    ...
  }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {inherit system;};
  in {
    devShells.${system}.default = pkgs.mkShell {
      DO_NOT_TRACK = 1;

      packages = with pkgs; [
        nodejs_24
        pnpm
        turbo

        typescript_7
      ];
    };
  };
}
