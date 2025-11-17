{ stdenv
, lib
}:

let
  uuid = "arsenik-quicksettings@souche.one";
  pname = "arsenik-quicksettings";
  version = "1.0.1";
  description = "Control Arsenik from the quicksettings";
  link = "https://github.com/elisesouche/arsenik-quicksettings";
in
stdenv.mkDerivation {
  pname = "gnome-shell-extension-${pname}";
  version = version;
  src = ./.;
  installPhase = ''
    runHook preInstall
    mkdir -p $out/share/gnome-shell/extensions/
    cp -r -T . $out/share/gnome-shell/extensions/${uuid}
    runHook postInstall
  '';
  meta = {
    description = builtins.head (lib.splitString "\n" description);
    longDescription = description;
    homepage = link;
    license = lib.licenses.gpl2Plus; # https://gjs.guide/extensions/review-guidelines/review-guidelines.html#licensing
    platforms = lib.platforms.linux;
    maintainers = [ lib.maintainers.elisesouche ];
  };
  passthru = {
    extensionPortalSlug = pname;
    # Store the extension's UUID, because we might need it at some places
    extensionUuid = uuid;
  };
}
